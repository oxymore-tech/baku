<template>
  <div class="led-box">
    <div class="led-light"
         v-bind:class = "[{led_green : connected},{led_red : offline},{led_orange : synced}]" ></div>
  </div>
</template>
<script>
  export default {
    computed: {
    connected() {
        return this.$store.getters['connected']
    },
    synced(){
         return !this.$store.getters['synced']
    },
    offline(){
        return this.$store.getters['offline']
    }
    }
  }
</script>
<style scoped>
.led-box { 
    width: 100%; 
    margin-top: 2px ;
    
}
.led-box p { 
    font-size: 12px; 
    text-align: center; 
    margin: 1em; 
}
.led-light { 
    margin: 0 auto; 
    width: 24px; 
    height: 24px; 
    border-radius: 50%; }

.led_green{
  border-radius: 50px;
  width:26px;
  padding: 2px 2px 0;
  margin-right: 10px;
  background-color: rgb(33, 192, 33);
}
.led_red {
  border-radius: 50px;
  width:26px;
  padding: 2px 2px 0;
  margin-right: 10px;
  background-color: rgb(255, 0, 0);
}
.led_orange{
  border-radius: 50px;
  width:26px;
  padding: 2px 2px 0;
  margin-right: 10px;
  background-color: rgba(172, 122, 16, 0.89);

}
  </style>