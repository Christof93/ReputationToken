<script setup>
import { onMounted } from 'vue'
import  { useNodeStore, isCorrectCategory } from '../stores/nodeStore'
import  { useSimStore } from '../stores/simStore'
import graphData from '../../acl2022.json'

const nodeStore = useNodeStore()
const simStore = useSimStore()
const myGraph = ForceGraph3D({controlType: "trackball"});

if (nodeStore.graphData==null) {
  graphData[0].graph_data.links = addBidirectionalLinks(graphData[0].graph_data.links)
}
nodeStore.graphData = graphData[0].graph_data
nodeStore.children = getChildren(nodeStore.graphData)
const nodeResolution = Math.floor(100/Math.log(nodeStore.graphData.nodes.length+2))
initBalances(simStore, nodeStore.graphData.nodes)
initTransaction(nodeStore, simStore, "~Niket_Tandon2", "H4xz8zteub9", 100)
nodeStore.confNode = setConfNode(nodeStore.graphData.nodes)
simStore.nPapers = countContributions(nodeStore.graphData.nodes, "Paper")
simStore.nReviews = countContributions(nodeStore.graphData.nodes, "Review")

console.log(nodeStore.graphData)
onMounted(()=> {
  myGraph(document.getElementById('graphViz'))
    .graphData(nodeStore.graphData)
    .nodeResolution(nodeResolution)
    .nodeColor((n) => {return nodeStore.nodeColorOn[n._type[0]]})
    .nodeVal((n) => {
      return nodeStore.getNodeSizeMap(nodeStore.graphData.nodes.length)[n._type[0]]
    })
    .nodeOpacity(0.9)
    .nodeLabel((node) => node.name!=null?node.name:node.id)
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
      else if (nodeStore.lookingForResource && isCorrectCategory(nodeStore, node)) {
        nodeStore.currentResource = node
        nodeStore.stopLookingForResource()
      }
    })
  nodeStore.graphViz=myGraph
})

function makeInfoNode(node) {
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
function initBalances(store, nodes) { 
  for (const node of nodes) {
    if (node._type[0]=="Conference") {
      node.spend_balance = store.startingSpendingBalance
      node.award_balance = 0
      node.collaterals = {"from": []}
    }
    else if (["Author","Reviewer"].includes(node._type[0])) {
      node.spend_balance = 0
      node.award_balance = store.startingAwardedBalance
      node.collaterals = {"to": []}
    }
  }
}
function initTransaction(nstore, sstorre, sender_id, recipient_id, amount) {
  sstorre.transactionAmount = amount
  for (const node of nstore.graphData.nodes) {
    if (node.id == sender_id) {
      nstore.currentAccount = node
    }
    else if (node.id == recipient_id) {
      nstore.currentResource = node
    }
  }

}
function addBidirectionalLinks(links) {
  let reLinks = [] 
  for (const link of links) {
    reLinks.push({"source": link.target, "target": link.source, "_type": "_GETS"+link._type}) 
  }
  return [...links, ...reLinks]
}

function getChildren(data) {
  let children = {}
  for (const node of data.nodes) {
    children[node.id] = []
  }
  for (const link of data.links) {
    children[link.source].push(link.target)
  }
  return children
}

function setConfNode(nodes) {
  for (const node of nodes) {
    if (node._type[0]=="Conference") {
      return node
    }
  }
}

function countContributions(nodes, type) {
  let contribs = 0
  for (const node of nodes) {
    if (node._type[0]==type) {
      contribs+=1
    }
  }
  return contribs
}

</script>

<template>
    <div id="graphViz"></div>
</template>

<style scoped></style>
