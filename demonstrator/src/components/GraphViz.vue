<script setup>
import { onMounted } from 'vue'
import  { useNodeStore, isCorrectCategory } from '../stores/nodeStore'
import  { useSimStore } from '../stores/simStore'
import graphData from '../../miccai2021.json'

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
initTransaction(nodeStore, simStore, "simona.vatrano@gmail.com", "kkW0RxKhvDa", 100)
nodeStore.confNode = setConfNode(nodeStore.graphData.nodes)
simStore.nPapers, simStore.nAcceptedPapers = countContributions(nodeStore.graphData.nodes, "Paper")
simStore.nReviews, simStore.nAcceptedReviews = countContributions(nodeStore.graphData.nodes, "Review")
for (const node of nodeStore.graphData.nodes) {
  nodeStore.idToNode[node.id] = node
}
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
    .nodeLabel((node) => {
      if (["Reviewer", "Author", "Conference"].includes(node._type[0])) {
        return node.name
      }
      else if (node._type[0]=="Paper") {
        return node.title
      }
      else {
        return node.id
      }
    })
    .linkWidth((link) => {return nodeStore.transactionLinks.includes(link)?4:1})
    .linkDirectionalParticleWidth(10)
    .linkDirectionalParticleColor("#F9DD00")
    .linkDirectionalParticleResolution(16)
    .linkLabel('_type')
    .enableNodeDrag(false)
    .cameraPosition({ z: 1500 })
    // .forceEngine('ngraph')
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
    .onEngineStop(()=>{
      if (nodeStore.loading) {
        simStore.progress=100
        clearInterval(simStore.loaderIntervalId)
        setTimeout(()=> {nodeStore.loading=false; simStore.progress=0}, 1500)
      }
    })
  myGraph.d3Force('link').distance((link)=>55)
  myGraph.numDimensions(3)

  nodeStore.graphViz=myGraph
  nodeStore.co = nodeStore.startCameraOrbit(1500)
})

function makeInfoNode(node) {
  let nodeInfo = {}
  for (const key in node) {
    if (key=="_type") {
      nodeInfo.type = node._type[0]
    }
    else if (key=="spend_balance" || key== "award_balance") {
      nodeInfo[key] = Number.parseFloat(node[key]).toFixed(2)
    }
    else if (key=="name" && node._type[0]=="Paper") {
      nodeInfo.title = node[key]
    } 
    else if (["date", "name", "avg_score", "score", "id", "score", "norm_score", "collaterals", "accepted", "title"].includes(key)) {
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
  let acceptedContribs = 0
  for (const node of nodes) {
    if (node._type[0]==type && node.accepted==1) {
      contribs+=1
      if (node.accepted==null || node.accepted==1) {
        acceptedContribs+=1
      }
    }
  }
  return contribs, acceptedContribs
}

</script>

<template>
    <div id="graphViz"></div>
</template>

<style scoped>

</style>
