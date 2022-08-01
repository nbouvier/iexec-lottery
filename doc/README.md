# Documentation

## Start the lottery

In order to start the lottery, NFTs needs to be added to the rewards (see `nftBatch`) using  
<code>Lottery.addToNftBatch(uint256 calldata tokenIds[])</code>  
Once at least one NFT is set as a reward, the lottery can be started by the contract owner.  
<code>Lottery.start()</code>

## Enter the lottery

Participants can enter the lottery, paying the specified entry fee in xRLC (see `entryFee`).  
<code>Lottery.enter()</code>  
A participant can enter as many time as he wants.

## End the lottery

When at least one participant entered, the lottery can be ended by the contract owner.  
<code>Lottery.end()</code>  
Winners will then be calculated, one winner per NFT in the lottery's rewards (can be twice the same address).  

## Winner calculation

Winner calculation is done using a random number brought on-chain thanks to an IExec oracle.
This number is hashed to a 32 bytes hash using `keccak256`. This ensure to always have a big number as used API for random number 
generation return numbers from 0 to 100 which might not be enough if the player number goes up to more than 100.  
After the hashing is done, a modulo operation is performed between the 32 bytes hash and the number of players to get the winner of the first NFT.  
This cycle keep going until all the NFTs are distributed.  

> Note that for each new cycle, the random number is right shifted by 128 and rehashed to prevent winner correlation without querying a new random number for each NFT to distribute.
