<style lang="scss" scoped>
    @import "@/styles/issue.scss";
</style>

<template>
  <div class="modal-card" style="width: auto">
      <div class="close"><i @click="$emit('close')" class="icon-close baku-button"></i></div>
      <header class="modal-card-head">
          <div class="card-head">
              <p class="modal-card-title">
                  <i class="icon-bullhorn-solid baku-button"></i><img src="@/assets/message.png"/>
              </p>
          </div>
      </header>
    <section class="modal-card-body">
        <p v-if="data.errors.length">
            <b class="error">Le formulaire est invalide :</b>
        <ul>
            <li class="error" v-for="error in data.errors">{{ error }}</li>
        </ul>
        </p>
        <span>Que voulez-vous nous dire ?</span>
        <select name="title" id="title" v-model="data.title.value">
          <option v-for="t in data.titles" v-bind:value="t.value">{{t.text}}</option>
        </select>
        <span>Ajoutez une adresse mail si vous souhaitez une réponse</span>
        <input type="text" name="email" id="email" required="" v-model="data.email.text">
        <span>Sur quel écran étiez-vous quand ce comportement s'est produit</span>
        <select name="screen" id="screen" v-model="data.screen.value">
          <option v-for="s in data.screens" v-bind:value="s.value">{{s.text}}</option>
        </select>
        <span>Que s'est-il passé exactement ?</span>
        <div class="form-group">
          <textarea class="message" name="textarea" id="textarea" required=""
                    v-model="data.message.text"
                    :maxlength="data.message.maxlength"></textarea>
          <span class="counter">{{ data.message.text.length }} / {{ data.message.maxlength }}</span>
        </div>
        <button type="submit" class="primary-button" @click.prevent="onSendIssue">Envoyer</button>
    </section>
  </div>
</template>


<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import axios from 'axios';
import router from '@/router';

@Component
export default class IssuePopup extends Vue {
    public data = {
      message: {
        text: '',
        maxlength: 255,
        sending: '',
      },
      title: {
        value: 'Nous remonter un comportement inattendu',
      },
      titles: [
        { text: 'Nous remonter un comportement inattendu', value: 'Nous remonter un comportement inattendu' },
      ],
      screen: {
        value: 'écran d\'accueil Baku',
      },
      screens: [
        { text: 'écran d\'accueil Baku', value: 'écran d\'accueil Baku' },
        { text: 'écran de capture d\'images', value: 'écran de capture d\'images' },
        { text: 'écran de ma librairie de films', value: 'écran de ma librairie de films' },
        { text: 'écran de gestion des plans', value: 'écran de gestion des plans' },
      ],
      email: {
        text: '',
      },
      errors: [] as string[],
      version: '',
      browser: {},
    }

    public async onSendIssue() {
      this.data.errors = [];
      if (!this.data.message.text) {
        this.data.errors.push('La description est obligatoire.');
      }
      if (!this.data.title.value) {
        this.data.errors.push('Le titre est obligatoire.');
      }

      if (this.data.title.value && this.data.message.text) {
        const url = router.resolve({name: "apiInfo"}).href;
        axios.get(url).then((response) => console.log(response.data)); //git.commit.describe
        const auth = {
          headers: { Authorization: 'token ' + 'bc92ede44c759d5816a1fc9b85abe91410ab6155' }, // put token in a store
        };
        this.data.message.sending = `__Sur quel écran étiez-vous :__ ${this.data.screen.value}\n__Description :__ ${this.data.message.text}`;
        if (this.data.email.text) {
          this.data.message.sending += `\n__Email :__ ${this.data.email.text}`;
        }
        this.data.message.sending += `\n__Informations navigateur :__ ${navigator.userAgent}`;
        axios.post('https://api.github.com/repos/BakuAnimation/baku/issues', { title: this.data.title.value, body: this.data.message.sending }, auth)
          .catch((e) => {
            console.log(e);
          });
        this.$emit('close');
      }
    }
}

</script>
