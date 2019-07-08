const Client = require('lightrpc');
const bluebird = require('bluebird');
const steem = require('steem');
const client = new Client('https://api.steemit.com');
steem.api.setOptions({  });
bluebird.promisifyAll(client);

const privKey ='';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const sendTokens = (parent_author,author) => {
  let wif = process.env.PRIVATEKEY ||privKey;
  let json = {
    "contractName":"tokens",
    "contractAction":"transfer",
    "contractPayload":
    [ {
      "symbol":"TRDO",
      "to":parent_author,
      "quantity":8,
      "memo":"You have recieved your Trendo Tokens"
      },
      {
      "symbol":"TRDO",
      "to":author,
      "quantity":2,
      "memo":"You have recieved your Trendo Tokens"
      }
    ]
  }
  steem.broadcast.customJson(wif, 'trendotoken', [], 'ssc-mainnet', json, function(err, result) {
  console.log(err, result);
});
}

const sendVotes = (parent_author,parent_permlink,author,permlink) =>{
  let wif = process.env.PRIVATEKEY ||privKey;
  //send parent vote
  steem.broadcast.vote(wif, 'trendotoken', parent_author, parent_permlink, 500, function(err, result) {
    console.log(err, result);
  });
  //send caller vote
  setInterval(steem.broadcast.vote(wif, 'trendotoken', author, permlink, 500, function(err, result) {
    console.log(err, result);
  }),3000)
}

const sendComments = (parent_author,parent_permlink,author,permlink) =>{
  let wif = process.env.PRIVATEKEY ||privKey;
  //send parent comment
  let parentComentBody = 'Parent post'
  let callerComentBody = 'Caller post'
  
  steem.broadcast.comment(wif, parent_author, parent_permlink, 'trendotoken', parent_permlink+"-reward", '', parentComentBody, {}, function(err, result) {
    console.log(err, result);
  });
  
  //send caller comment
  setInterval(steem.broadcast.comment(wif, author, permlink, 'trendotoken', permlink+"-reward", '', callerComentBody, {}, function(err, result) {
    console.log(err, result);
  }),3000)
}
const getBlock = blockNum => client.sendAsync({ method: 'get_block', params: [blockNum] }, null);

const getOpsInBlock = (blockNum, onlyVirtual = false) =>
  client.sendAsync({ method: 'get_ops_in_block', params: [blockNum, onlyVirtual] }, null);

const getGlobalProps = () =>
  client.sendAsync({ method: 'get_dynamic_global_properties', params: [] }, null);

const mutliOpsInBlock = (start, limit, onlyVirtual = false) => {
  const request = [];
  for (let i = start; i < start + limit; i++) {
    request.push({ method: 'get_ops_in_block', params: [i, onlyVirtual] });
  }
  return client.sendBatchAsync(request, { timeout: 20000 });
};

const getBlockOps = block => {
  const operations = [];
  block.transactions.forEach(transaction => {
    operations.push(...transaction.operations);
  });
  return operations;
};

module.exports = {
  sleep,
  getBlock,
  sendTokens,
  getOpsInBlock,
  getGlobalProps,
  mutliOpsInBlock,
  getBlockOps,
  sendComments,
  sendVotes
};
