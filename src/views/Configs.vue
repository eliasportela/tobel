<template>
  <div class="container-fluid mt-2 mb-3">
    <div class="border rounded-sm px-3 pb-3" v-if="!load">
      <h6 class="font-weight-bold mt-4 mb-3 text-center">Configurações do Bot</h6>
      <form @submit.prevent="salvaConfigs()">
        <div class="row">
          <div class="col-6 mb-3">
            <label class="small mb-0 font-weight-bold" for="nomeBot">Nome</label>
            <input type="text" id="nomeBot" class="form-control" v-model="dados.nome_bot" placeholder="Nome customizado do BOT" required>
          </div>
          <div class="col-6 mb-3">
            <label class="small mb-0 font-weight-bold" for="nomeBot">Ícone</label>
            <select class="form-control" v-model="dados.icon_bot">s
              <option value="🤖">🤖 (Robo)</option>
              <option value="😎">😎 (Irado)</option>
              <option value="🤠‍">🤠‍️ (Cowboy)</option>
              <option value="👩🏼‍🍳">Chef (Mulher)</option>
              <option value="🧑🏼‍🍳">Chef (Homem)</option>
              <option value="🧑🏼‍🎤">Cantor</option>
              <option value="🧑🏼‍💻">Nerd</option>
              <option value="🥷🏼">Ninja</option>
              <option value="🐮">🐮</option>
              <option value="🐷">🐷</option>
              <option value="🐔">🐔</option>
              <option value="🍕">🍕</option>
              <option value="🍔">🍔</option>
              <option value="🍟">🍟</option>
              <option value="🥗">🥗</option>
              <option value="🍦">🍦</option>
              <option value="🍣">🍣</option>
            </select>
          </div>
          <div class="col-12">
            <div class="custom-control custom-checkbox">
              <input type="checkbox" class="custom-control-input" id="atendimento" @change="dados.atendimento = dados.atendimento === '1' ? '0' : '1'" :checked="dados.atendimento === '1'">
              <label class="custom-control-label" for="atendimento">Habilitar atendimento humano</label>
            </div>
          </div>
          <div class="col-12 mb-2" v-if="dados.atendimento === '1'">
            <label class="small mb-0 font-weight-bold" for="atendimentoTempo">Tempo de atendimento (minutos)</label>
            <input type="number" id="atendimentoTempo" class="form-control" v-model="dados.atendimento_tempo" placeholder="Tempo médio de atendimento">
            <div class="small">Configure o tempo de espera para a solicitação de atendente</div>
          </div>
          <div class="col-12 mb-2 mt-2" v-else>
          <textarea id="atendimentoMsg" class="form-control" v-model="dados.atendimento_msg" rows="5"
                    placeholder="Caso você acredite que precisa de uma pessoa para lhe auxiliar, tente entrar em contato através do nosso telefone: (35) 92222-2222"
                    style="resize: none"></textarea>
            <div class="small">Configure a resposta automática quando o cliente solicitar um atendente humano</div>
          </div>
          <div class="col-12 mb-2 mt-2">
            <button class="btn btn-success btn-block" type="submit">Salvar</button>
          </div>
        </div>
      </form>
    </div>
    <div class="d-flex justify-content-center" style="height: 400px" v-else>
      <div class="m-auto text-center">
        <img src="../assets/logo-zap.png" class="d-inline-block animated flipInY infinite" alt="Logo Lecard"
             style="width: 64px; border-radius: 6px">
        <div class="small mt-2 text-secondary">Carregando dados..</div>
      </div>
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = require('electron');
const Config = require('electron-config');
const config = new Config();

export default {
  name: 'Login',
  data() {
    return {
      token: '',
      load: true,
      dados: {
        id_chatbot: '',
        nome_bot: 'LeBot',
        icon_bot: '🤖',
        atendimento: '1',
        atendimento_tempo: '1',
        atendimento_msg: ''
      }
    }
  },

  methods: {
    getConfigs() {
      this.$http.get('chatbot/config/' + this.token)
        .then(res => {
          this.dados = res.data;
          this.load = false;

        }, res => {
          console.log(res);
          this.load = false;
        });
    },

    salvaConfigs() {
      this.load = true;
      this.$http.post('chatbot/config/' + this.token, this.dados)
        .then(res => {
          ipcRenderer.send('toggle-wpp', null);
          this.load = false;

        }, res => {
          console.log(res);
          this.load = false;
        });
    }
  },

  mounted() {
    this.token = config.get('key');
    this.getConfigs();
  }
}
</script>
