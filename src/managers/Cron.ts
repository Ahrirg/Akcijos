import cron from 'node-cron';
import { updateDatabase } from '../utils/Fetch';
import { parseUnparsedData } from "../managers/Ai";
import { cleanUpAkcija, cleanUpMagazine, cleanUpPage} from "../utils/db";

cron.schedule('0 0 * * *', () => {
    console.log(`Running daily scrapping task... (${(new Date()).toISOString()})`);
    try {
        updateDatabase().then(() => {
            console.log(`Daily scrapping task (${(new Date()).toISOString()}) has succeded`);
        });
    } catch (err) {
        console.error(`!!!!!!!!!!!!!!\nDaily scrapping task has failed (${(new Date()).toISOString()})\n${err}\n\n!!!!!!!!!!!!!!`)
    }
});

cron.schedule('30 0 * * *', () => {
    console.log(`Running daily LLM task... (${(new Date()).toISOString()})`);
    try {
        parseUnparsedData().then(() => {
            console.log(`Daily LLM task (${(new Date()).toISOString()}) has succeded`);
        })
    } catch (err) {
        console.error(`!!!!!!!!!!!!!!\nDaily LLM task has failed (${(new Date()).toISOString()})\n${err}\n\n!!!!!!!!!!!!!!`)
    }
});

cron.schedule('0 4 * * *', () => {
    console.log(`Running daily cleanup task... (${(new Date()).toISOString()})`);
    try {
        cleanUpAkcija();
        cleanUpMagazine();
        cleanUpPage();
        console.log(`Daily cleanup task (${(new Date()).toISOString()}) has succeded`);
    } catch (err) {
        console.error(`!!!!!!!!!!!!!!\nDaily cleanup task has failed (${(new Date()).toISOString()})\n${err}\n\n!!!!!!!!!!!!!!`)
    }
});