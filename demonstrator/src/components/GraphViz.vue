<script setup>
import  { useNodeStore, isCorrectCategory } from '../stores/nodeStore'
const nodeStore = useNodeStore()
const myGraph = ForceGraph3D({controlType: "trackball"});
fetch('acl2022.json')
  .then(response => {
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      return response.json();
  })
  .then(data => {
    data = data[0].graph_data
    const nodeResolution = Math.floor(100/Math.log(data.nodes.length+2))
    console.log(data);
    initBalances(data.nodes)
    myGraph(document.getElementById('graphViz'))
      .graphData(data)
      .nodeResolution(nodeResolution)
      .nodeColor((n) => {return nodeStore.nodeColorOn[n._type[0]]})
      .nodeVal((n) => {
        return nodeStore.getNodeSizeMap(data.nodes.length)[n._type[0]]
      })
      .linkLabel('_type')
    //   .numDimensions(2)
      .enableNodeDrag(false)
      //   .forceEngine('ngraph')
      .onNodeClick((node)=>{
        nodeStore.nodeInfo = makeInfoNode(node)
        if (nodeStore.lookingForSpender && isCorrectCategory(nodeStore, node)) {
          nodeStore.currentAccount = node
          nodeStore.stopLookingForSpender()
        }
        else if (nodeStore.lookingForRecipient && isCorrectCategory(nodeStore, node)) {
          nodeStore.currentRecipient = node
          nodeStore.stopLookingForRecipient()
        }
      })
    nodeStore.graphViz=myGraph
  })
  .catch(error => {
    console.error('There was a problem with your fetch operation:', error);
  });


function makeInfoNode(node) {
  console.log(node)
  let nodeInfo = {}
  for (const key in node) {
    if (key=="_type") {
      nodeInfo.type = node._type[0]
    }
    else if (key=="name" && node._type[0]=="Paper") {
      nodeInfo.title = node[key]
    } 
    else if (["date", "name", "avg_score", "score", "id", "score", "norm_score"].includes(key)) {
      nodeInfo[key] = node[key]
    }
  }
  return nodeInfo
}
function initBalances(nodes) { 
  for (const node of nodes) {
    if (node._type[0]=="Conference") {
      node.spend_balance = nodeStore.startingSpendingBalance
      node.award_balance = 0
    }
    else {
      node.spend_balance = 0
      node.award_balance = nodeStore.startingAwardedBalance
    }
    node.collaterals = 0
  }
}
</script>

<template>
    <div id="graphViz"></div>
</template>

<style scoped></style>
