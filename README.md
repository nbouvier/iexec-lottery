# iexec-lottery

## Powered by Hardhat

## Initialize
Install all the dependencies  
<code>npm i</code>  
    
Create a .secret file to store the private key of the main account if not using local network (not a best practice, but this was used for test purpose)  
<code>touch .secret</code>  
    
Duplicate config/config-example.ts to config/config-local.ts and config/config-test.ts if necessary  
Don't forget to fill in OracleTest (Oracle if viviani testnet) and OracleId properties with both GenericOracle contract address and your oracleId  
<code>cp ./config/config-example.ts ./config/config-local.ts</code>  
<code>cp ./config/config-example.ts ./config/config-test.ts</code>  

Compile and check tests  
<code>npx hardhat test</code>
    
See available tasks  
<code>npx hardhat</code>  

## Lottery usage on local network

Deploy all the contracts  
10 NFTs are pre-minted to first account and Lottery contract is already approved  
<code>npx hardhat run scripts/deploy.ts --network localhost</code>  

Add NFTs to lottery rewards  
<code>npx hardhat lottery-add-nfts-to-rewards --tokenids <tokenids> --network localhost</code>  
<code>npx hardhat lottery-get-nft-rewards --network localhost</code>  

Start the lottery  
<code>npx hardhat lottery-start --network localhost</code>  

Enter the lottery with several accounts  
<code>npx hardhat lottery-enter --addresses <addresses> --totals <totals> --network localhost</code>
<code>npx hardhat lottery-get-players --network localhost</code>  

End the lottery and see winners  
<code>npx hardhat lottery-end --network localhost</code>  

Note that for test purpose on local network, OracleTest is used insteed of GenericOracle and can be updated the following way  
<code>npx hardhat oracle-set-value --value <value> --network localhost</code>  
<code>npx hardhat oracle-get-value --network localhost</code>  
<code>npx hardhat oracle-storage-fetch-value --network localhost</code>  
<code>npx hardhat oracle-storage-get-value --network localhost</code>  
