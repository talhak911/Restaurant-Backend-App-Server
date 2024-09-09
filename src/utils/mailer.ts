import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL,
    pass: process.env.PASS,
  },
});

export const sendOTPEmail = async (to: string, otp: string,type:"Verify"|"Reset") => {
try {
    const mailOptions = {
        from: process.env.GMAIL,
        to,
        subject: `${type==="Verify"?"Account":"Reset Password"} Confirmation OTP`,
        text: `Your OTP for ${type==="Verify"?"account confirmation":"reset password"} is: ${otp}`,
      };
    
      await transporter.sendMail(mailOptions);
} catch (error:any) {
    throw new Error(error.message)
}
};
