const mailchimp = require("@mailchimp/mailchimp_marketing");
const log = require('./logger');
mailchimp.setConfig({
    apiKey: "YOUR_API_KEY",
    server: "YOUR_SERVER_PREFIX",
});

module.exports = {
    test: async () => {
        const response = await mailchimp.ping.get();
      
    },
    // Add a contact to an audience
    AddContact: async (listId, firstName, lastName, email) => {
        log.info(`Start function AddContact. DATA: ${JSON.stringify({listId, firstName, lastName, email})}`);
        const list = listId;
        const subscribingUser = {
            firstName: firstName,
            lastName: lastName,
            email: email
        };
        const response = await mailchimp.lists.addListMember(list, {
            email_address: subscribingUser.email,
            status: "subscribed",  //Use "pending" to send a confirmation email.
            merge_fields: {
                FNAME: subscribingUser.firstName,
                LNAME: subscribingUser.lastName
            }
        });
        log.info(`End function AddContact. DATA: ${JSON.stringify(response)}`);
        return response;
    },

}