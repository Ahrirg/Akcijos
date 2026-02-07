import cron from 'node-cron';
import { updateDatabase } from '../utils/Fetch';


cron.schedule('0 0 * * *', () => {
    console.log(`Running daily scrapping task... (${(new Date()).toISOString()})`);
    try {
        updateDatabase();
        console.log(`Daily scrapping task (${(new Date()).toISOString()}) has succeded`);
    } catch (err) {
        console.error(`!!!!!!!!!!!!!!\nDaily scrapping task has failed (${(new Date()).toISOString()})\n${err}\n\n!!!!!!!!!!!!!!`)
    }
});