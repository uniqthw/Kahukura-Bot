import nodemailer from "nodemailer";
import settings from "../settings.json";

async function main() {
    const transporter = nodemailer.createTransport(settings.email as any);

    const target = process.argv[2] || settings.email.auth.user;

    try {
        const info = await transporter.sendMail({
            from: `"UniQ Te Herenga Waka [noreply]" <${settings.email.auth.user}>`,
            to: target,
            subject: "Test: Kahukura Bot email",
            text: "This is a test email from Kahukura Bot. If you received this, SMTP is configured correctly.",
            html: "<p>This is a <b>test</b> email from Kahukura Bot. If you received this, SMTP is configured correctly.</p>"
        });

        console.log("Message sent:", info.messageId);
        process.exit(0);
    } catch (err) {
        console.error("Failed to send test email:", err);
        process.exit(1);
    }
}

main();
