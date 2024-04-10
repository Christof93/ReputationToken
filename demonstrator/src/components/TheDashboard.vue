<script setup>
import { ref } from 'vue'
import ReputationTokenIcon from './IconReputationToken.vue'
const balance = 1200
const totalCollaterals = 140
const to = ref('')
function makeAccountSelectable() {

}
</script>

<template>
      <v-card
        title="Controls"
        width="400"
        class="controls"
      >
        <v-card-text>
          <div>Account:</div>
          <v-btn>Select Account</v-btn>
        </v-card-text>
        <v-card-text>
          <div class="text-body-1">Spendable Tokens: {{ balance }} <font-awesome-icon :icon="['fas', 'circle-star']" /></div>
          <div class="text-body-1">Total Collaterals: {{ totalCollaterals }} <font-awesome-icon :icon="['fas', 'circle-star']" /> <ReputationTokenIcon class="inline-icon"/></div>
        </v-card-text>
        <!-- <v-divider inset></v-divider> -->
        <v-card-text>
          <v-btn>Select Recipient</v-btn>
          <v-btn>send to</v-btn>
        </v-card-text>
      </v-card>        
      <v-container class="visualization">
        <GraphViz></GraphViz>
      </v-container>
</template>

<style scoped>
.controls {
  z-index: 1;
  position: fixed;
}
.inline-icon {
  height: 1.5em;
  margin-left:0.5em;
}
</style>
