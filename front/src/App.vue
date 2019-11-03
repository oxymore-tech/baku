<template>
    <div id="app">
        <div id="nav">
            <router-link to="/">Home</router-link>
            |
            <router-link to="/about">About</router-link>
            <router-link to="/computer">Computer PoV</router-link>
            <router-link to="/smartphone">Smartphone PoV</router-link>
        </div>
        <router-view/>
    </div>
</template>

<style>
    #app {
        font-family: "Avenir", Helvetica, Arial, sans-serif;
        color: #2c3e50;
    }

    #nav {
        padding: 30px;
    }

    #nav a {
        font-weight: bold;
        color: #2c3e50;
        margin-left: 16px;
    }

    #nav a.router-link-exact-active {
        color: #42b983;
    }
</style>
