<script setup>
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
    console.log(nodeResolution)
    console.log(data);
    const nodeSizeMap = {
        "Conference":data.nodes.length,
        "Paper":20,
        "Author":10,
        "Review":3,
        "Reviewer":2,
    }
    myGraph(document.getElementById('graphViz'))
      .graphData(data)
      .nodeResolution(nodeResolution)
      .nodeAutoColorBy((n)=> {return n._type[0]})
      .nodeVal((n)=> {
        return nodeSizeMap[n._type[0]]
      })
      .linkLabel('_type')
    //   .numDimensions(2)
      .enableNodeDrag(false)
    //   .forceEngine('ngraph')
  })
  .catch(error => {
    console.error('There was a problem with your fetch operation:', error);
  });

</script>

<template>
    <div id="graphViz"></div>
</template>

<style scoped></style>
