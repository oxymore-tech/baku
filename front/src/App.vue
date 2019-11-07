<template>
  <div id="app">
    <link href="https://fonts.googleapis.com/css?family=Montserrat&display=swap" rel="stylesheet" />
    <!-- <div id="nav">
            <router-link to="/">Home</router-link>
            |
            <router-link to="/about">About</router-link>
            <router-link to="/computer">Computer PoV</router-link>
            <router-link to="/smartphone">Smartphone PoV</router-link>
    </div>-->
    <nav>
      <h1>Baku animation</h1>
      <router-link to="/home">Home</router-link>
      <router-link to="/capture">Capture</router-link>
      <!-- <router-link to="/smartphone">Smartphone PoV</router-link> -->
    </nav>
    <router-view />
  </div>
</template>

<style lang="scss">
  @import "styles/style.scss";
</style>