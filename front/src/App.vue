<template>
  <div id="app">
    <link href="https://fonts.googleapis.com/css?family=Montserrat&display=swap" rel="stylesheet"/>

    <nav>
      <h1>Baku animation</h1>
      <router-link to="/home">Home</router-link>
      <router-link to="/capture">Capture</router-link>
    </nav>
    <router-view/>
  </div>
</template>

<style lang="scss">
  @import "styles/style.scss";
</style>
