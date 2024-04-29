import { defineStore } from 'pinia'

export const useSettingsStore = defineStore({
    id: 'settings',
    state: () => ({
        showSimulationInfo:false,
        showVizSettings:false,
        showReviews:true,
    }),
    actions: {
        
    },
    getters: {
       
    }
})