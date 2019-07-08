const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const mongoClient = require('./mongo_utils')
const utils = require('./utils');
var Block = require('./models/block').Block;
var Call = require('./models/call').Call;
var ValidationError = require('mongoose/lib/error/validation')
const port = process.env.PORT || 4000;
const cache = {};
const useCache = false;

var lastDailyBlock = 0;
var lastHourlyBlock = 0;

const limit = 50;

const clearGC = () => {
  try {
    global.gc();
  } catch (e) {
    console.log("You must run program with 'node --expose-gc index.js' or 'npm start'");
  }
};

setInterval(clearGC, 60 * 1000);
 
/** Stream the blockchain for Transactions */

const getTransactions = ops => {
  //console.log("in getTxn getting txns")
  ops.forEach(op => {
    const type = op.op[0];
    const params = op.op[1];
    switch (type) {
      //validate trendo call and send reward
      case 'comment': {
        /** Record call */
        const transaction = {
          parent_author	: params.parent_author,
          parent_permlink: params.parent_permlink,
          author: params.author,
          permlink:params.permlink,
          block: op.block,
          status:"pending"
        };
        let body = params.body
        
        if(body.match(/!trendotoken/i)){
          console.log("Trendo called!!")
          console.log(body)
          //Save  call
          Call.create(transaction)
          
          //check for daily calls
          Call.countDocuments({block: { $gte: lastDailyBlock },status: "success"})
          .then(count =>{
            if (count < 200){
              //check for user calls
              Call.countDocuments({block: { $gte: lastDailyBlock },status: "success", author:transaction.author})
              .then(count =>{
                if (count <=5){
                   //send tokens
                  utils.sendTokens(transaction.parent_author,transaction.author)
                  //Save successful call
                  Call.findOneAndUpdateAsync()
                  .then(result =>{
                  //broadcast vote
                  utils.sendVotes(transaction.parent_author,transaction.parent_permlink,transaction.author,transaction.permlink);
                  //broadcast comment
                  utils.sendComments(transaction.parent_author,transaction.parent_permlink,transaction.author,transaction.permlink);
                  })
                  .catch(err=>{
                    console.log(err);
                  })
                }
              })
              .catch(err=>{
                console.log(err);
              })              
            }
          })
          .catch(err=>{
            console.log(err);
          })          
        }
        break;
        
      }
    }
  });
  return true

};

const loadBlock = blockNum => {
 // console.log('in blocknum and loading block Num '+blockNum)
  utils
    .getOpsInBlock(blockNum, false)
    .then(ops => {
      if (!ops.length) {
       console.error('in here with ', blockNum);
        console.error('Block does not exist?', blockNum);
        utils
          .getBlock(blockNum)
          .then(block => {
            if (block && block.previous && block.transactions.length === 0) {
              console.log('Block exist and is empty, load next', blockNum);
               } else {
              console.log('Sleep and retry', blockNum);
              utils.sleep(2000).then(() => {
                loadBlock(blockNum);
              });
            }
          })
          .catch(err => {
            console.log(
              'Error lightrpc (getBlock), sleep and retry',
              blockNum,
              JSON.stringify(err),
            );
            utils.sleep(2000).then(() => {
              loadBlock(blockNum);
            });
          });
      } else {
        console.log
       Block.findOneAndUpdateAsync({},{'blockNum':blockNum})
       .then(function (block) {
           //console.log("Saving block no :"+block)
           var flag = getTransactions(ops);
           flag === true ? loadNextBlock():loadBlock(blockNum)
         }).catch(ValidationError, function(err) {
           err.logError = false
           err.productionMessage = true
           throw err
         });
        }
          })
    .catch(err => {
      console.error('Call failed with lightrpc (getOpsInBlock)', err);
      console.log('Retry', blockNum);
      loadBlock(blockNum);
    });
};

const loadNextBlock = () => {
    Block.findOne().lean().then(function(foundItems){
      console.log("last_block num : #" +foundItems.blockNum)

      let nextBlockNum = null;
      if(foundItems!==null){
       nextBlockNum = parseInt(foundItems.blockNum)+1;
       console.log("Now processing next block : #"+nextBlockNum)
      }else{
       nextBlockNum =  31880016  ;// testing purpose
      }
     utils
       .getGlobalProps()
       .then(globalProps => {
        // console.log("globalProps "+globalProps)
         const lastIrreversibleBlockNum = globalProps.last_irreversible_block_num;
         if (lastIrreversibleBlockNum >= nextBlockNum) {
           //console.log("calling loadblock()"+nextBlockNum)
           loadBlock(nextBlockNum);
           //console.log("calling loadblock() done "+nextBlockNum)
         } else {
           utils.sleep(2000).then(() => {
             console.log(
               'Waiting to be on the lastIrreversibleBlockNum',
               lastIrreversibleBlockNum,
               'now nextBlockNum',
               nextBlockNum,
             );
             loadNextBlock();
           });
         }
       })
       .catch(err => {
         console.error('Call failed with lightrpc (getGlobalProps)', err);
         utils.sleep(2000).then(() => {
           console.log('Retry loadNextBlock', nextBlockNum);
           loadNextBlock();
         });
       });
     })
   }

const start = () => {
  console.info('Start streaming blockchain');
  loadNextBlock();
};

start();


