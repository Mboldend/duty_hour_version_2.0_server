import colors from 'colors';
import { Server, Socket } from 'socket.io';
import { logger } from '../shared/logger';
import { AttendanceServices } from '../app/modules/attendance/attendance.service';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import { Attendance } from '../app/modules/attendance/attendance.model';
import moment from 'moment';
import { User } from '../app/modules/user/user.model';
import { Location } from '../app/modules/location/location.model';
import ApiError from '../errors/ApiError';


// Online users track করতে map
const onlineUsers = new Map<string, string>(); // socket.id -> userID

const socket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(colors.blue(`🟢 Client connected: ${socket.id}`));
    socket.on('user-check-in', async (payload: any, callback: any) => {
      const safeCallback = typeof callback === 'function' ? callback : () => { };

      const token = socket.handshake.auth?.token;
      if (!token) {
        return safeCallback({
          status: 'error',
          message: 'Authentication token missing',
        });
      }

      let userID: string;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          id: string;
        };
        userID = decoded.id;
      } catch (err) {
        return safeCallback({ status: 'error', message: 'Invalid token' });
      }

      try {
        if (!payload.wifiIPAddress) {
          return safeCallback({
            status: 'error',
            message: 'WiFi IP address are required',
          });
        }

        const now = moment.utc();
        const user = await User.findById(userID);
        if (!user) {
          return safeCallback({
            status: 'error',
            message: 'User not found',
          });
        }

        const location = await Location.findOne({
          institutionID: user.institutionID,
        });
        if (!location) {
          return safeCallback({
            status: 'error',
            message: 'No location configured for this institution',
          });
        }

        if (location.wifiIPAddress !== payload.wifiIPAddress) {
          return safeCallback({
            status: 'error',
            message: `Please connect to the correct network (SSID: ${location.wifiSSID})`,
          });
        }

        let attendance = await Attendance.findOne({
          userID,
          createdAt: {
            $gte: moment.utc().startOf('day').toDate(),
            $lte: moment.utc().endOf('day').toDate(),
          },
        });

        if (!attendance) {
          attendance = await AttendanceServices.checkIn(userID, payload);
          attendance.sessions = [];
        } else if (!attendance.sessions) {
          attendance.sessions = [];
        }

        attendance.sessions.push({
          startTime: now.toDate(),
          endTime: now.toDate(),
        });

        const totalDuration = attendance.sessions.reduce((total, session) => {
          const start = moment.utc(session.startTime);
          const end = moment.utc(session.endTime);
          return total + end.diff(start, 'minutes');
        }, 0);

        attendance.durationMinutes = totalDuration;
        await attendance.save();

        onlineUsers.set(socket.id, userID);

        safeCallback({
          status: 'success',
          message: 'Check-in successful',
          attendance: attendance.toObject(),
        });
      } catch (error: any) {
        logger.error('Check-in error:', error);
        safeCallback({
          status: 'error',
          message: error.message || 'Check-in failed',
        });
      }
    });

    socket.on('disconnect', async () => {
      // logger.info(colors.red(`🔴 User disconnected: ${socket.id}`));

      const userID = onlineUsers.get(socket.id);
      if (userID) {
        try {
          // Find today's attendance
          const attendance = await Attendance.findOne({
            userID,
            createdAt: {
              $gte: moment.utc().startOf('day').toDate(),
              $lte: moment.utc().endOf('day').toDate(),
            },
          });
          if (
            attendance &&
            attendance.sessions &&
            attendance.sessions.length > 0
          ) {
            const now = moment.utc();

            // Close the current session by updating its end time
            const currentSession =
              attendance.sessions[attendance.sessions.length - 1];
            currentSession.endTime = now.toDate();

            // Calculate total duration from all sessions
            const totalDuration = attendance.sessions.reduce(
              (total, session) => {
                const start = moment.utc(session.startTime);
                const end = moment.utc(session.endTime);
                return total + end.diff(start, 'minutes');
              },
              0,
            );

            // Update attendance fields
            attendance.checkOutTime = now.toDate();
            attendance.durationMinutes = totalDuration;

            await attendance.save();

            // Emit final session update to client
            io.to(socket.id).emit('attendance-duration-update', {
              status: 'success',
              attendance: attendance.toObject(),
              message: 'Session closed due to disconnect',
            });

            logger.info(
              `✅ Session closed for user ${userID}. Total duration: ${totalDuration} minutes`,
            );
          } else {
            logger.warn(
              `⚠️ No active session found for user: ${userID} on disconnect`,
            );
          }
        } catch (err) {
          logger.error('Error updating session on disconnect:', err);
        }
      }

      onlineUsers.delete(socket.id);
    });
  });

  // Update connected users' session duration every 30 seconds
  setInterval(async () => {
    for (const [socketId, userID] of onlineUsers.entries()) {
      try {
        const attendance = await Attendance.findOne({
          userID,
          createdAt: {
            $gte: moment.utc().startOf('day').toDate(),
            $lte: moment.utc().endOf('day').toDate(),
          },
        });

        if (
          !attendance ||
          !attendance.sessions ||
          attendance.sessions.length === 0
        ) {
          io.to(socketId).emit('attendance-duration-update', {
            status: 'error',
            message: 'No active session found',
          });
          continue;
        }

        const now = moment.utc();

        const currentSession =
          attendance.sessions[attendance.sessions.length - 1];

        // Only update end time for the current session
        currentSession.endTime = now.toDate();

        // Calculate current session duration
        const currentDuration = moment
          .utc(currentSession.endTime)
          .diff(moment.utc(currentSession.startTime), 'minutes');

        // Calculate total duration from all sessions
        const totalDuration = attendance.sessions.reduce((total, session) => {
          const start = moment.utc(session.startTime);
          const end = moment.utc(session.endTime);
          return total + end.diff(start, 'minutes');
        }, 0);

        // Update attendance fields
        attendance.durationMinutes = totalDuration;
        attendance.checkOutTime = now.toDate();

        await attendance.save();

        // Send real-time update to client
        io.to(socketId).emit('attendance-duration-update', {
          status: 'success',
          attendance: attendance.toObject(),
          message: 'Session updated',
        });

        logger.info(
          `✅ Updated session for user ${userID} - Current: ${currentDuration}m, Total: ${totalDuration}m`,
        );
      } catch (error: any) {
        logger.error('Error updating session duration:', error);
        io.to(socketId).emit('attendance-duration-update', {
          status: 'error',
          message: 'Error updating session',
        });
      }
    }
  }, 30000);
};

export const socketHelper = { socket };
