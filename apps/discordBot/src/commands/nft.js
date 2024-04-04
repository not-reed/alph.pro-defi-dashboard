//Shows NFT Info
const { SlashCommandBuilder } = require("@discordjs/builders");

const { success, notSuccess } = require("../core/messageDisplay.js");
const { commaFormat, eighteenDigits } = require("../core/helpers.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("nft")
  .setDescription("Displays NFT info")
  .addStringOption((option) =>
    option
      .setName("collection")
      .setDescription("Enter a collection address")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option.setName("index").setDescription("Enter a NFT index")
  );

// Callback for discord
const execute = async (interaction) => {
  await nft(interaction);
};

module.exports = { discordData, execute };

//Command function
async function nft(interaction) {
  const collectionAddress = interaction.options.getString("collection");

  const nftIndex = interaction.options.getInteger("index");

  if (nftIndex) {
    const getSingleNftInfo = await fetch(
      `https://indexer.alph.pro/api/nfts/by-index/${collectionAddress}/${nftIndex}`
    );

    const getUri = await fetch(getSingleNftInfo.nft.uri).then((a) => a.json());

    let attributesMessage;
    if (getUri.attributes.length > 0) {
      attributesMessage = "```";
      const longestTraitLength = getUri.attributes.reduce(
        (max, attr) => Math.max(max, attr.trait_type.length),
        0
      );

      for (const attribute of getUri.attributes) {
        attributesMessage += `${attribute.trait_type.padEnd(
          longestTraitLength
        )}: ${attribute.value}\n`;
      }
      attributesMessage += "```";
    } else {
      attributesMessage = "Not Available";
    }

    const messageSingleNftInfo = `Index: ${getSingleNftInfo.nft.nftIndex}

Address: [${getSingleNftInfo.nft.address.slice(
      -4
    )}...${getSingleNftInfo.nft.address.slice(
      -4
    )}](https://explorer.alephium.org/addresses/${getSingleNftInfo.nft.address})
Collection: [${getSingleNftInfo.nft.collectionAddress.slice(
      -4
    )}...${getSingleNftInfo.nft.collectionAddress.slice(
      -4
    )}](https://explorer.alephium.org/addresses/${
      getSingleNftInfo.nft.collectionAddress
    })
Owner: [${getSingleNftInfo.owner.slice(-4)}...${getSingleNftInfo.owner.slice(
      -4
    )}](https://explorer.alephium.org/addresses/${getSingleNftInfo.owner})

Attributes:
${attributesMessage}

Buy: [DeadRare](https://deadrare.io/collection-from-contract/${
      getSingleNftInfo.nft.collectionAddress
    })`;

    await success(
      interaction,
      getSingleNftInfo.nft.name,
      messageSingleNftInfo,
      false,
      `https://images.alph.pro/images?width=256&height=256&uri=${getSingleNftInfo.nft.image}`
    );
  } else {
    const getNftInfo = await fetch(
      `https://indexer.alph.pro/api/nfts/${collectionAddress}`
    ).then((a) => a.json());

    const getTotalSupply = await fetch(
      `https://indexer.alph.pro/api/nfts/holders/${collectionAddress}`
    ).then((a) => a.json());

    const messageNftInfo = `Name: ${getNftInfo.nft.name}
Collection:  [${getNftInfo.nft.address.slice(
      -4
    )}...${getNftInfo.nft.address.slice(
      -4
    )}](https://explorer.alephium.org/addresses/${getNftInfo.nft.address})
Total Supply: ${getTotalSupply.holders[0].holders.length}

Desc: ${getNftInfo.nft.description}

Buy: [DeadRare](https://deadrare.io/collection-from-contract/${
      getNftInfo.nft.address
    })`;

    await success(
      interaction,
      "NFT Info",
      messageNftInfo,
      false,
      `https://images.alph.pro/images?width=256&height=256&uri=${getNftInfo.nft.image}`
    );
  }
}
