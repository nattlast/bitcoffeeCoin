
var BitcoffeeCoin = artifacts.require("BitcoffeeCoin")
var BoutChannel = artifacts.require("BoutChannel")

const ethUtil = require('ethereumjs-util')

contract('BitcoffeeCoin', function(accounts) {
    let contract
    
    beforeEach(async () => {
        contract = await BitcoffeeCoin.new()
    })


    it("Total Supply should be 13000000", async() => {
        let result = await contract.totalSupply.call()
        assert.equal(result.toString(), '13000000000')
    })


    it("Token name should be BitcoffeeCoin", async() => {
        let addr0 = accounts[0]
        let addr1 = accounts[1]
        let total = await contract.totalSupply.call()
        let balance = await contract.balanceOf.call(addr1)
        assert.equal(balance.toString(), '0')
        await contract.transfer(addr1, 10)
        let balance2 = await contract.balanceOf.call(addr1)
        assert.equal(balance2.toString(), '10')
        let balance3 = await contract.balanceOf.call(addr0)
        assert.equal(balance3.toString(), (total - balance2).toString())
    })
 
});

contract('BoutChannel', function(accounts) {
    let bcof

    beforeEach(async () => {
        bcof = await BitcoffeeCoin.new()
    })

    let bout
    
    beforeEach(async () => {
        bout = await BoutChannel.new()
    })


    it("Default nonce of any account should be 0", async() => {
        let owner = accounts[0]
        let client = accounts[0]
        await bout.init(bcof.address)
        let result = await bout.getNonce.call(owner)
        assert.equal(result.toString(), "0")
        result = await bout.getNonce.call(client)
        assert.equal(result.toString(), "0")
    })


    // it("Should something", async() => {
    //     const util = require('ethereumjs-util');
    //     const msg = new Buffer('hello');
    //     const sig = web3.eth.sign(web3.eth.accounts[0], '0x' + msg.toString('hex'));
    //     const res = util.fromRpcSig(sig);
    //     const prefix = new Buffer("\x19Ethereum Signed Message:\n");
    //     const prefixedMsg = util.sha3( Buffer.concat([prefix, new Buffer(String(msg.length)), msg]) );
    //     const pubKey = util.ecrecover(prefixedMsg, res.v, res.r, res.s);
    //     const addrBuf = util.pubToAddress(pubKey);
    //     const addr = util.bufferToHex(addrBuf);
    //     console.log(web3.eth.accounts[0]);
    //     console.log(addr);
    // })


    it("Recovery from signature should return signer", async() => {
        let owner = accounts[0]

        await bout.init(bcof.address)

        expiration = 2 * (await bout.getNow.call());
        nonce = 1;
        points = 1;
        challenged = false;

        const msg = await bout.pack.call(
            expiration, nonce, points, challenged
        );
        const sig = web3.eth.sign(owner, msg);
        const res = ethUtil.fromRpcSig(sig);

        const prefixedMsg = await bout.encode.call(expiration, nonce, points, challenged);
        owner = await bout.getOwner.call();

        const result = await bout.recover.call(
            ethUtil.bufferToHex(prefixedMsg),
            res.v,
            ethUtil.bufferToHex(res.r),
            ethUtil.bufferToHex(res.s)
        );

        assert.equal(result.toString(), owner.toString())
    })


    it("Non-challenged redeem should update nonce and transfer tokens", async() => {
        let owner = accounts[0]

        await bout.init(bcof.address)

        tokens = 100;
        await bcof.transfer(bout.address, tokens);

        expiration = 2 * (await bout.getNow.call());
        nonce = 2
        points = 1
        challenged = false

        const msg = await bout.pack.call(
            expiration, nonce, points, challenged);
        const sig = web3.eth.sign(owner, msg);
        const res = ethUtil.fromRpcSig(sig);

        const prefixedMsg = await bout.encode.call(
            expiration, nonce, points, challenged);

        owner = await bout.getOwner.call();

        await bout.redeem(
            expiration, 
            nonce, 
            points, 
            challenged, 
            res.v,
            ethUtil.bufferToHex(res.r),
            ethUtil.bufferToHex(res.s));

        let result = await bout.getNonce.call(owner);
        assert.equal(result.toString(), nonce.toString());

        let balanceOwn = await bcof.balanceOf.call(owner);
        assert.equal(balanceOwn.toString(), (await bcof.totalSupply.call() - tokens + 1).toString());
    })


    it("Challeged redeem should update nonce, but without transfering tokens", async() => {
        let owner = accounts[0]

        await bout.init(bcof.address)
        tokens = 100;
        await bcof.transfer(bout.address, tokens);

        expiration = 2 * (await bout.getNow.call());
        nonce = 2
        points = 1
        challenged = true

        const msg = await bout.pack.call(
            expiration, nonce, points, challenged
        );
        const sig = web3.eth.sign(owner, msg);
        const res = ethUtil.fromRpcSig(sig);

        const prefixedMsg = await bout.encode.call(expiration, nonce, points, challenged);
        owner = await bout.getOwner.call();

        await bout.redeem(
            expiration, 
            nonce, 
            points, 
            challenged, 
            res.v,
            ethUtil.bufferToHex(res.r),
            ethUtil.bufferToHex(res.s))

        let result = await bout.getNonce.call(owner);
        assert.equal(result.toString(), nonce.toString());

        let balance = await bcof.balanceOf.call(bout.address);
        assert.equal(balance.toString(), tokens.toString());
    })


    it("Refund should transfer the tokens when the certificate is valid", async() => {
        let owner = accounts[0]

        await bout.init(bcof.address)
        tokens = 100;
        await bcof.transfer(bout.address, tokens);

        expiration = 2 * (await bout.getNow.call());
        nonce = 2
        points = 1
        challenged = true

        const msg = await bout.pack.call(
            expiration, nonce, points, challenged
        );
        const sig = web3.eth.sign(owner, msg);
        const res = ethUtil.fromRpcSig(sig);

        const prefixedMsg = await bout.encode.call(expiration, nonce, points, challenged);
        owner = await bout.getOwner.call();

        await bout.redeem(
            expiration, 
            nonce, 
            points, 
            challenged, 
            res.v,
            ethUtil.bufferToHex(res.r),
            ethUtil.bufferToHex(res.s));
        
        await bout.setWaitBlocks(1);

        await bout.refund(
            expiration, 
            nonce, 
            points, 
            challenged);

        let balance = await bcof.balanceOf.call(bout.address);
        assert.equal(balance.toString(), (tokens - points).toString());
        
    })


    it("Veto should prevent redeem", async() => {
        let owner = accounts[0]

        await bout.init(bcof.address)
        tokens = 100;
        await bcof.transfer(bout.address, tokens);

        expiration = 2 * (await bout.getNow.call());
        nonce = 2
        points = 1
        challenged = true

        const msg = await bout.pack.call(
            expiration, nonce, points, challenged
        );
        const sig = web3.eth.sign(owner, msg);
        const res = ethUtil.fromRpcSig(sig);

        const prefixedMsg = await bout.encode.call(expiration, nonce, points, challenged);
        owner = await bout.getOwner.call();

        await bout.veto(
            owner,
            expiration, 
            nonce, 
            points, 
            challenged, 
            res.v,
            ethUtil.bufferToHex(res.r),
            ethUtil.bufferToHex(res.s)
        );

        let result = await bout.getNonce.call(owner);
        assert.equal(result.toString(), nonce.toString());
        
    })


});