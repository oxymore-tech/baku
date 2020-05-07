<style lang="scss" scoped>
    @import "@/styles/issue.scss";
</style>

<template>
  <div class="modal-card" style="width: auto">
    <header class="modal-card-head">
      <p class="modal-card-title">Image</p>
      <i @click="$emit('close')" class="icon-close baku-button"></i>
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
        <span>Vous pouvez tous nous dire (encouragements appréciés ^.^)</span>
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

@Component
export default class IssuePopup extends Vue {
    public data = {
      message: {
        text: '',
        maxlength: 255,
        sending: '',
      },
      title: {
        value: 'Titre 1',
      },
      titles: [
        { text: 'Titre 1', value: 'Titre 1' },
        { text: 'Titre 2', value: 'Titre 2' },
      ],
      screen: {
        value: 'Ecran de capture',
      },
      screens: [
        { text: 'Ecran de capture', value: 'Ecran de capture' },
        { text: 'Ecran de', value: 'Ecran de' },
      ],
      email: {
        text: '',
      },
      errors: [] as string[]
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
        const auth = {
          headers: { Authorization: 'token ' + '559c06c95c08954dfac31c41bb94c1445908dbb5' }, // put token in a store
        };
        this.data.message.sending = `__Sur quel écran étiez-vous :__ ${this.data.screen.value}\n__Description :__ ${this.data.message.text}`;
        if (this.data.email.text) {
          this.data.message.text += `\n__Email :__ ${this.data.email.text}`;
        }
        axios.post('https://api.github.com/repos/BakuAnimation/baku/issues', { title: this.data.title.value, body: this.data.message.sending }, auth)
          .catch((e) => {
            console.log(e);
          });
        this.$emit('close');
      }
    }
}

</script>
