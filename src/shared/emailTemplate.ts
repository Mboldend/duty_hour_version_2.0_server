import { ICreateAccount, IEmailTemplate, IResetPassword } from '../types/emailTamplate';

const LOGO_URL = `https://res.cloudinary.com/dabd4udau/image/upload/v1772862251/xcvjopcwvaaxrt7uhbsx.png`;

const createAccount = (values: ICreateAccount) => {
  const data = {
    to: values.email,
    subject: 'Verify your Duty Hour Tracking Account',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#0d0d0d;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d0d0d;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #1f1f1f;">

        <tr>
          <td style="background:linear-gradient(135deg,#0a2a2e 0%,#0d3b42 50%,#0a2a2e 100%);padding:40px 48px 36px;border-bottom:1px solid #1a3a40;">
            <img src="${LOGO_URL}" alt="Duty Hour Tracking" style="display:block;height:36px;width:auto;margin-bottom:28px;" />
            <div style="display:inline-block;background:rgba(59,122,135,0.15);border:1px solid rgba(59,122,135,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#5ec4d4;text-transform:uppercase;margin-bottom:18px;">● &nbsp;Email Verification</div>
            <div style="font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;letter-spacing:-0.02em;margin-bottom:8px;">Welcome aboard, ${values.name} 👋</div>
            <div style="font-size:14px;color:#6b8a8e;">Let's confirm your identity to get started.</div>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 48px;">
            <p style="font-size:15px;color:#777777;line-height:1.7;margin:0 0 24px;">
              You're one step away from accessing your <strong style="color:#cccccc;font-weight:600;">Duty Hour Tracking</strong> account. Use the verification code below to complete your registration.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d0d0d;border:1px solid #1a1a1a;border-radius:12px;margin:0 0 28px;">
              <tr><td style="padding:28px;text-align:center;">
                <div style="font-size:11px;font-weight:600;color:#444444;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:16px;">Your One-Time Code</div>
                <div style="font-size:48px;font-weight:700;color:#ffffff;letter-spacing:0.15em;line-height:1;">${values.otp}</div>
                <div style="margin-top:16px;font-size:12px;color:#444444;font-weight:500;">⏱ &nbsp;Expires in 3 minutes</div>
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
              <tr><td style="height:1px;background:#1f1f1f;font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
              <tr>
                <td width="32" valign="top" style="padding-bottom:16px;"><div style="width:24px;height:24px;border-radius:50%;background:rgba(59,122,135,0.12);border:1px solid rgba(59,122,135,0.25);text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#5ec4d4;">1</div></td>
                <td style="padding-bottom:16px;padding-left:10px;font-size:14px;color:#666666;line-height:1.6;">Copy the 6-digit code shown above.</td>
              </tr>
              <tr>
                <td width="32" valign="top" style="padding-bottom:16px;"><div style="width:24px;height:24px;border-radius:50%;background:rgba(59,122,135,0.12);border:1px solid rgba(59,122,135,0.25);text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#5ec4d4;">2</div></td>
                <td style="padding-bottom:16px;padding-left:10px;font-size:14px;color:#666666;line-height:1.6;">Return to the verification screen and enter the code.</td>
              </tr>
              <tr>
                <td width="32" valign="top"><div style="width:24px;height:24px;border-radius:50%;background:rgba(59,122,135,0.12);border:1px solid rgba(59,122,135,0.25);text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#5ec4d4;">3</div></td>
                <td style="padding-left:10px;font-size:14px;color:#666666;line-height:1.6;">Your account will be activated instantly.</td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
              <tr><td style="background:rgba(255,180,0,0.04);border:1px solid rgba(255,180,0,0.12);border-radius:10px;padding:16px;">
                <p style="font-size:13px;color:#7a6a40;line-height:1.6;margin:0;">⚠️ &nbsp;Never share this code with anyone. Duty Hour Tracking will never ask for your OTP via phone or email.</p>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 48px;border-top:1px solid #181818;background-color:#0d0d0d;text-align:center;">
            <p style="font-size:12px;color:#333333;margin:0;">© ${new Date().getFullYear()} <span style="color:#3b7a87;font-weight:600;">Duty Hour Tracking</span> &nbsp;·&nbsp; This is an automated message, please do not reply.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
  return data;
};

const resetPassword = (values: IResetPassword) => {
  const data = {
    to: values.email,
    subject: 'Reset your Duty Hour Tracking Account password',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#0d0d0d;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d0d0d;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #1f1f1f;">

        <tr>
          <td style="background:linear-gradient(135deg,#0a2a2e 0%,#0d3b42 50%,#0a2a2e 100%);padding:40px 48px 36px;border-bottom:1px solid #1a3a40;">
            <img src="${LOGO_URL}" alt="Duty Hour Tracking" style="display:block;height:36px;width:auto;margin-bottom:28px;" />
            <div style="display:inline-block;background:rgba(59,122,135,0.15);border:1px solid rgba(59,122,135,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#5ec4d4;text-transform:uppercase;margin-bottom:18px;">● &nbsp;Password Reset</div>
            <div style="font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;letter-spacing:-0.02em;margin-bottom:8px;">Reset your password</div>
            <div style="font-size:14px;color:#6b8a8e;">We received a request to reset your account password.</div>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 48px;">
            <p style="font-size:15px;color:#777777;line-height:1.7;margin:0 0 24px;">
              Use the code below to verify your identity and proceed with creating a new password.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d0d0d;border:1px solid #1a1a1a;border-radius:12px;margin:0 0 28px;">
              <tr><td style="padding:28px;text-align:center;">
                <div style="font-size:11px;font-weight:600;color:#444444;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:16px;">Your One-Time Code</div>
                <div style="font-size:48px;font-weight:700;color:#ffffff;letter-spacing:0.15em;line-height:1;">${values.otp}</div>
                <div style="margin-top:16px;font-size:12px;color:#444444;font-weight:500;">⏱ &nbsp;Expires in 3 minutes</div>
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
              <tr><td style="height:1px;background:#1f1f1f;font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="background:rgba(255,180,0,0.04);border:1px solid rgba(255,180,0,0.12);border-radius:10px;padding:16px;">
                <p style="font-size:13px;color:#7a6a40;line-height:1.6;margin:0;">⚠️ &nbsp;Didn't request this? You can safely ignore this email — your password will remain unchanged. Someone may have entered your email by mistake.</p>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 48px;border-top:1px solid #181818;background-color:#0d0d0d;text-align:center;">
            <p style="font-size:12px;color:#333333;margin:0;">© ${new Date().getFullYear()} <span style="color:#3b7a87;font-weight:600;">Duty Hour Tracking</span> &nbsp;·&nbsp; This is an automated message, please do not reply.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
  return data;
};

const employeeEmailTemplate = (values: IEmailTemplate) => {
  const data = {
    to: values.email,
    subject: 'Welcome to Duty Hour Tracking App',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#0d0d0d;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d0d0d;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #1f1f1f;">

        <tr>
          <td style="background:linear-gradient(135deg,#0a2a2e 0%,#0d3b42 50%,#0a2a2e 100%);padding:40px 48px 36px;border-bottom:1px solid #1a3a40;">
            <img src="${LOGO_URL}" alt="Duty Hour Tracking" style="display:block;height:36px;width:auto;margin-bottom:28px;" />
            <div style="display:inline-block;background:rgba(59,122,135,0.15);border:1px solid rgba(59,122,135,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#5ec4d4;text-transform:uppercase;margin-bottom:18px;">● &nbsp;New Account Created</div>
            <div style="font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;letter-spacing:-0.02em;margin-bottom:8px;">Welcome to the team, ${values.name} 🎉</div>
            <div style="font-size:14px;color:#6b8a8e;">Your employee account is ready to use.</div>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 48px;">
            <p style="font-size:15px;color:#777777;line-height:1.7;margin:0 0 8px;">
              Your account on <strong style="color:#cccccc;font-weight:600;">Duty Hour Tracking</strong> has been set up by your administrator. Use the temporary credentials below to sign in for the first time.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
              <tr><td style="height:1px;background:#1f1f1f;font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d0d0d;border:1px solid #1a1a1a;border-radius:10px;margin-bottom:28px;">
              <tr>
                <td style="padding:18px 22px;">
                  <div style="font-size:11px;font-weight:600;color:#444444;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Temporary Password</div>
                  <div style="font-size:22px;font-weight:700;color:#5ec4d4;font-family:'Courier New',Courier,monospace;letter-spacing:0.08em;">${values.password}</div>
                </td>
                <td align="right" style="padding:18px 22px;width:60px;">
                  <div style="width:38px;height:38px;background:rgba(59,122,135,0.1);border:1px solid rgba(59,122,135,0.2);border-radius:8px;text-align:center;line-height:38px;font-size:18px;">🔑</div>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
              <tr><td style="height:1px;background:#1f1f1f;font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
              <tr>
                <td width="32" valign="top" style="padding-bottom:16px;"><div style="width:24px;height:24px;border-radius:50%;background:rgba(59,122,135,0.12);border:1px solid rgba(59,122,135,0.25);text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#5ec4d4;">1</div></td>
                <td style="padding-bottom:16px;padding-left:10px;font-size:14px;color:#666666;line-height:1.6;">Sign in using your email and the temporary password above.</td>
              </tr>
              <tr>
                <td width="32" valign="top" style="padding-bottom:16px;"><div style="width:24px;height:24px;border-radius:50%;background:rgba(59,122,135,0.12);border:1px solid rgba(59,122,135,0.25);text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#5ec4d4;">2</div></td>
                <td style="padding-bottom:16px;padding-left:10px;font-size:14px;color:#666666;line-height:1.6;">Navigate to <strong style="color:#aaaaaa;">Account Settings → Security</strong>.</td>
              </tr>
              <tr>
                <td width="32" valign="top"><div style="width:24px;height:24px;border-radius:50%;background:rgba(59,122,135,0.12);border:1px solid rgba(59,122,135,0.25);text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#5ec4d4;">3</div></td>
                <td style="padding-left:10px;font-size:14px;color:#666666;line-height:1.6;">Create a new strong password to secure your account.</td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
              <tr><td style="background:rgba(255,180,0,0.04);border:1px solid rgba(255,180,0,0.12);border-radius:10px;padding:16px;">
                <p style="font-size:13px;color:#7a6a40;line-height:1.6;margin:0;">⚠️ &nbsp;For your security, change your password immediately after your first login. Do not share your credentials with anyone.</p>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 48px;border-top:1px solid #181818;background-color:#0d0d0d;text-align:center;">
            <p style="font-size:12px;color:#333333;margin:0;">© ${new Date().getFullYear()} <span style="color:#3b7a87;font-weight:600;">Duty Hour Tracking</span> &nbsp;·&nbsp; This is an automated message, please do not reply.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
  return data;
};

export const emailTemplate = {
  createAccount,
  resetPassword,
  employeeEmailTemplate,
};