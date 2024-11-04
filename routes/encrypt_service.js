const sequelize = require("../db_config"); // Adjust the path as needed
const { Sequelize } = require("sequelize");

const ENCRYPTION_KEY = "encryption_key"; // Make sure to use the same key

async function decryptValue(encryptedValue) {
    if (!encryptedValue) return null;

    const result = await sequelize.sequelize.query(
        `SELECT CONVERT(AES_DECRYPT(?, ?) USING 'utf8') AS decrypted`,
        {
            replacements: [encryptedValue, ENCRYPTION_KEY],
            type: Sequelize.QueryTypes.SELECT
        }
    );

    return result[0]?.decrypted || null; // Return the decrypted value or null
}

module.exports = {
    decryptValue
};
