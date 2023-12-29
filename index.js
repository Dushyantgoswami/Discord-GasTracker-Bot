require('dotenv').config();
const { Client, Intents, Status } = require('discord.js');
const { ethers } = require('ethers');

const AlchemyApiKey = process.env.ALCHEMY_API_KEY;
const rpcUrl = `https://eth-mainnet.g.alchemy.com/v2/${AlchemyApiKey}`;

const provider = new ethers.providers.JsonRpcProvider({ url: rpcUrl });
const client = new Client({
  intents: [
    1 << 0, // GUILDS
    1 << 3, // GUILD_MESSAGES
  ],
});

async function gasfee() {
  try {
    const apiToken = process.env.GAS_API_TOKEN;
    const fee = await fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${apiToken}`);
    const response = await fee.json();

    return {
      high: parseInt(response.result.FastGasPrice),
      average: parseInt(response.result.ProposeGasPrice),
      low: parseInt(response.result.SafeGasPrice)
    };
  } catch (error) {
    console.error('Error fetching gas fees:', error);
    return { high: 0, average: 0, low: 0 };
  }
}

async function updateBotPresence(highGas, averageGas, lowGas) {
  try {
    const emojiMap = {
      high: '⚡', // High fees
      average: '🏃‍♂️', // Average fees
      low: '🐢' // Low fees
    };

    const status = `${emojiMap.high}${highGas} | ${emojiMap.average}${averageGas} | ${emojiMap.low}${lowGas}`;

    // Access the client's presence and set the activity
    client.user.setActivity({
      name:status
    });
    console.log('Bot presence updated with gas prices:', status); // Add this line to log the status set
    console.log(status);
  } catch (error) {
    console.error('Error updating bot presence:', error);
  }
}

async function updateGasPricesContinuously() {
  try {
    const gasPrices = await gasfee(); // Fetch gas fees initially
    await updateBotPresence(gasPrices.high, gasPrices.average, gasPrices.low);

    setInterval(async () => {
      const updatedGasPrices = await gasfee(); // Fetch updated gas fees
      await updateBotPresence(updatedGasPrices.high, updatedGasPrices.average, updatedGasPrices.low);
    }, 6000); // Update gas prices every 6 seconds
  } catch (error) {
    console.error('Error fetching or updating gas prices:', error);
  }
}


client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Fetch gas prices initially
  const gasPrices = await gasfee();
  console.log(gasPrices); // Confirm gas prices are received correctly

  // Update bot's activity with gas prices formatted as desired
  updateBotPresence(gasPrices.high, gasPrices.average, gasPrices.low);

  // Start continuous updating of gas prices in the bot's presence
  updateGasPricesContinuously();
});

client.login(process.env.DISCORD_BOT_TOKEN);
