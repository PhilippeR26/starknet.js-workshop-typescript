import axios from 'axios';
import * as dotenv from "dotenv";
import { CairoCoderAPIkey } from '../../A1priv/A1priv';
dotenv.config();

async function main() {
const question ="Write a simple Cairo v2.11.4 contract that convert an array of shortstring to a ByteArray";
const ApiKey=CairoCoderAPIkey;

    const response = await axios.post('https://api.cairo-coder.com/v1/chat/completions', {
        messages: [
            {
                role: 'user',
                content: question,
            }
        ]
    }, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ApiKey,
        }
    });

    console.log(response.data.choices[0].message.content);

    console.log("✅ request performed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

