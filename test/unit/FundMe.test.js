const { deployments, ethers, getNamedAccounts } = rrequire("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      let fundMe;
      let deployer;
      let MockV3Aggregator;
      // const sendValue="1000000000000000000"
      const sendValue = ethers.utils.parseEther("1"); //1 ETH

      beforeEach(async () => {
        //deploy our fundme Contract
        //using hardhat-deploy

        // const {deployer} = await getNamedAccounts()
        deployer = (await getNamedAccounts()).deployer;

        //deploy all the contract in deploy folder
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);

        MockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("contructor", async () => {
        it("sets the aggregator address correctly", async () => {
          const response = await fundMe.getPriceFeed();
          assert.equals(response, MockV3Aggregator.address);
        });
      });

      describe("fund", async () => {
        it("Fails if you don't have enough ETH", async () => {
          await expect(fundMe.fund()).to.be.revertedWith(
            "you Need to spend more ETH"
          );
        });

        it("updated the amount funded data structure", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });
        it("Add funder to s_funders Array", async () => {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunders(0);
          assert.equal(funder, deployer);
        });
      });

      describe("withdraw", async () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });

        it("withdraw Eth from a single founder", async () => {
          //arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          //act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          //assert

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingDeployerBalance.add(startingFundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("aloows us to withdraw with  multiple s_funders", async () => {
          //arrange

          const accounts = ethers.getSigners();
          for (let index = 1; index < 6; index++) {
            const fundMeConnectedContract = await fundMe.connect(
              accounts[index]
            );
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          //act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          //assert

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          //assert

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingDeployerBalance.add(startingFundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          //make sure that all s_funders reset to zero

          await expect(fundMe.getFunders(0)).to.be.reverted;
          for (let index = 1; index < 6; index++) {
            assert.equal(
              fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("only owner to withdraw", async () => {
          const accounts = ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = fundMe.connect(attacker);
          await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          );
        });
      });

      describe("cheaperWithdraw...", async () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });

        it("withdraw Eth from a single founder", async () => {
          //arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          //act
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          //assert

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingDeployerBalance.add(startingFundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("aloows us to withdraw with  multiple s_funders", async () => {
          //arrange

          const accounts = ethers.getSigners();
          for (let index = 1; index < 6; index++) {
            const fundMeConnectedContract = await fundMe.connect(
              accounts[index]
            );
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          //act
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          //assert

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          //assert

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingDeployerBalance.add(startingFundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          //make sure that all s_funders reset to zero

          await expect(fundMe.getFunders(0)).to.be.reverted;
          for (let index = 1; index < 6; index++) {
            assert.equal(
              fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("only owner to withdraw", async () => {
          const accounts = ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = fundMe.connect(attacker);
          await expect(
            attackerConnectedContract.cheaperWithdraw()
          ).to.be.revertedWith("FundMe__NotOwner");
        });
      });
    });
