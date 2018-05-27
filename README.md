# Bitcoffee's Loyalty Program Smart Contracts

This repository contains the smart contracts used by Bitcoffee (www.bitcoffee.coffee) for its loyalty program. The BitcoffeeCoin is a standard ERC20 token built from the base implementation published in open-zeppelin. These tokens are exchanged off chain to reduce network fees, but can be settled to the blockchain at any time.

## Bounded Trust Multi-party Payment Channel

The Bounded Trust Multi-party Payment Channel (Bout Channel for short), is a smart contract for safely managing ERC20 tokens. The exchange of tokens is performed off chain in order to reduce network fees. This is done by exchanging cryptographically signed certificates. The channel requires one distinguished participant to lock funds in order to be able to issue redeemable certificates. Any user with an ethereum address can receive any number of these certificates and also issue back receipts.

At any point in time a user can choose to redeem his last certificate for its accumulated value. When this happens the transfer of tokens is settled in the ethereum blockchain and from that point onwards the tokens are treated as any other ERC20 token.

Unlike other off chain payment channels, Bout channels do not require to know the participants ahead of time, and also allow issuing certificates to multiple addresses from a single fund. Transfer of certificates still occurs bidirectionally between the participants and the distinguised channel owner. Additionally, the channel owner still to monitor the network in order to prevent invalid certificates to be redeemed.

Of course, there is a trade-off. Bout channels can be subjected to replay attacks. The owner of the channel can protect himself from such attacks by vetoing dishonest redeems. The users can protect themselves by redeeming tokens quickly. Thus, trust is bounded by the value of the unclaimed tokens weigthed by the reputation loss in case of dishonest behaviour from the well-known host.


