import fs from 'fs';
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const privateKey = fs.existsSync('.secret') ? fs.readFileSync('.secret').toString().trim() : '';

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.9",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545"
        },
        viviani: {
            url: "https://viviani.iex.ec",
            accounts: [ privateKey ],
            chainId: 133,
        }
    }
};

export default config;
