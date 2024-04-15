<script setup>
import { onMounted } from 'vue'
import  { useNodeStore, isCorrectCategory } from '../stores/nodeStore'
import graphData from '../../acl2022.json'

const nodeStore = useNodeStore()
const myGraph = ForceGraph3D({controlType: "trackball"});

nodeStore.graphData = graphData[0].graph_data
const nodeResolution = Math.floor(100/Math.log(nodeStore.graphData.nodes.length+2))
initBalances(nodeStore.graphData.nodes);
nodeStore.graphData.links = addBidirectionalLinks(graphData[0].graph_data.links)
console.log(nodeStore.graphData);
onMounted(()=> {
  myGraph(document.getElementById('graphViz'))
    .graphData(nodeStore.graphData)
    .nodeResolution(nodeResolution)
    .nodeColor((n) => {return nodeStore.nodeColorOn[n._type[0]]})
    .nodeVal((n) => {
      return nodeStore.getNodeSizeMap(nodeStore.graphData.nodes.length)[n._type[0]]
    })
    .linkWidth((link) => {return nodeStore.transactionLinks.includes(link)?6:1})
    .linkDirectionalParticleWidth(10)
    .linkDirectionalParticleColor("#F9DD00")
    .linkDirectionalParticleResolution(16)
    .linkLabel('_type')
    // .numDimensions(2)
    .enableNodeDrag(false)
    //   .forceEngine('ngraph')
    .onNodeClick((node)=>{
      nodeStore.nodeInfo = makeInfoNode(node)
      if (nodeStore.lookingForSpender && isCorrectCategory(nodeStore, node)) {
        nodeStore.currentAccount = node
        nodeStore.stopLookingForSpender()
      }
      else if (nodeStore.lookingForRecipient && isCorrectCategory(nodeStore, node)) {
        nodeStore.currentResource = node
        nodeStore.stopLookingForRecipient()
      }
    })
  nodeStore.graphViz=myGraph
})

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
    else if (["date", "name", "avg_score", "score", "id", "score", "norm_score", "award_balance", "spend_balance", "collaterals"].includes(key)) {
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
    node.collaterals = {}
  }
}
function addBidirectionalLinks(links) {
  let reLinks = [] 
  for (const link of links) {
    reLinks.push({"source": link.target, "target": link.source, "_type": "_GETS"+link._type}) 
  }
  return [...links, ...reLinks]
}
</script>

<template>
    <div id="graphViz"></div>
</template>

<style scoped></style>
