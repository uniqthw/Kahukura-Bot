import { Command, DBVerificationUser } from "../../../@types";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Interaction, SlashCommandBuilder } from "discord.js";
import { createTransport } from "nodemailer";
import MongoDb from "../../utils/mongo";
import settings from "../../../settings.json";

export default class MyUserDataCommand implements Command {
    name = "mydata";
    description = "Get a copy of your data stored in our verification database.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
    );

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.deferReply({ ephemeral: true });

        const verificationUser = await MongoDb.getInstance().getVerificationUser(interaction.user.id);

        if (!verificationUser || (!verificationUser.email && !verificationUser.oldEmail)) return await interaction.editReply({
            content: "You have no personal information in our user verification database."
        });

        if (!verificationUser.email && verificationUser.oldEmail) return await interaction.editReply({
            content: "Unfortunately, you need to contact us at [itadmin@uniqthw.org.nz](mailto:itadmin@uniqthw.org.nz) to manually process your request."
        });

        if (verificationUser.lastDataRequest && Date.now () < (verificationUser.lastDataRequest + 7 * 24 * 60 * 60 * 1000)) return await interaction.editReply({
            content: `You have previously requested a copy of your data <t:${Math.floor(verificationUser.lastDataRequest / 1000)}:R>, you can only do this once every 7 days.`
        });

        // Builds the button components for the confirmation message
        const confirmButton = new ButtonBuilder().setCustomId("confirm").setLabel("Confirm Request").setStyle(ButtonStyle.Success);
        const cancelButton = new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary);
        const componentsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

        const verifyDeletionRequestResponse = await interaction.editReply({
            content: `Are you sure you would like to make a request for your data? You can only do this every 7 days. You will receive a copy of your data in your email.`,
            components: [ componentsRow ]
        });

        const collectionFilter = (i: Interaction) => i.user.id === interaction.user.id;

        try {
            const confirmation = await verifyDeletionRequestResponse.awaitMessageComponent({ filter: collectionFilter, time: 60_000 })

            if (confirmation.customId === "confirm") {
                await confirmation.deferUpdate();

                try {
                    await this.processDataRequest(verificationUser);
                } catch (error) {
                    await confirmation.editReply({ content: "An error occurred whilst completing your data request. Please contact us at [itadmin@uniqthw.org.nz](mailto:itadmin@uniqthw.org.nz) to manually process your request.", components: []  });
                    return console.error("An error occurred whilst processing a user's data request:", error);
                }

                return await confirmation.editReply({ content: "Action confirmed. You should have received a copy of your data to the email you used to verify your account.", components: [] });
            } else if (confirmation.customId === "cancel") {
                return await confirmation.update({ content: "Action cancelled.", components: [] });
            }
        } catch (error) {
            console.error(error);
            return await interaction.editReply({ content: "Confirmation was not received within 1 minute, cancelling request.", components: [] });
        }
    }

    private async processDataRequest(verificationUser: DBVerificationUser) {
        const fileUri = await this.generateDataRequestFile(verificationUser);

        // Create a transporter object using the default SMTP transport
        let transporter = createTransport(settings.email);

        // Send mail with defined transport object
        await transporter.sendMail({
            from: `"UniQ Te Herenga Waka [noreply]" <${settings.email.auth.user}>`,
            to: verificationUser.email,
            subject: `Your data request`,
            text: `Please see the attached file for a copy of your data.`, // Plain text body
            html: `<b>Please see the attached file for a copy of your data.</b>`, // HTML body
            attachments: [
                {
                    filename: `${verificationUser._id}_data_${Date.now()}.json`,
                    content: fileUri,
                    encoding: "base64"
                }
            ]
        });

        await MongoDb.getInstance().updateVerificationUserLatestDataRequest(verificationUser._id, Date.now());
    }

    private async generateDataRequestFile(data: DBVerificationUser): Promise<string> {
        // Sanitises DBVerificationUser object to remove certain properties that are not personal information and important not to include
        const sanitisedData = { ...data };
        delete sanitisedData.verificationData;
        delete sanitisedData.lastDataRequest;
        delete sanitisedData.manualVerificationData;

        // Converts DBVerificationUser object into JSON
        const lookupFileContent = JSON.stringify(sanitisedData);

        // Returns JSON in base64 string
        return Buffer.from(lookupFileContent).toString("base64");
    }
} 