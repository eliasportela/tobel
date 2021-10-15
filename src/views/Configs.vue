<template>
  <div class="container-fluid mb-3">
    <div v-if="!load">
      <div class="py-3 border-bottom mb-3">
        <router-link to="config" class="menu text-decoration-none active">Configs</router-link>
        <router-link to="blocklist" class="menu text-decoration-none">Blocklist</router-link>
      </div>
      <div v-show="menu === 1">
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
            <div class="col-12 mb-3" v-if="dados.atendimento === '1'">
              <label class="small mb-0 font-weight-bold" for="atendimentoTempo">Tempo de atendimento (minutos)</label>
              <input type="number" id="atendimentoTempo" class="form-control" v-model="dados.atendimento_tempo" placeholder="Tempo médio de atendimento">
              <div class="small">Configure o tempo de espera para a solicitação de atendente</div>
            </div>
            <div class="col-12 mb-3 mt-2" v-else>
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
      <div v-show="menu === 2">
        <h6 class="font-weight-bold mt-4 mb-3 text-center">Adicionar Empresa</h6>
        <form @submit.prevent="logar()">
          <div class="mb-2">
            <label class="small mb-0 font-weight-bold" for="nomeBot">Usuário</label>
            <input type="text" id="email" class="form-control" v-model="login.email" placeholder="Email" required>
          </div>
          <div class="mb-3">
            <label class="small mb-0 font-weight-bold" for="nomeBot">Senha</label>
            <input type="password" id="senha" class="form-control" v-model="login.senha" placeholder="Senha" required>
          </div>
          <button class="btn btn-success btn-block mb-4">Adicionar</button>
        </form>
        <hr>
        <div class="row no-gutters py-2" v-for="b in dados.bandeiras">
          <div class="col-9">{{b.nome_fantasia}}</div>
          <div class="col-3 text-right"><button class="btn btn-sm btn-danger" @click="removerEmpresa(b)">Remover</button></div>
        </div>
      </div>
      <div class="text-center mt-3">
        <a href="javascript:" class="text-success small" @click="menu = (menu === 1 ? 2 : 1)">{{menu === 2 ? "Voltar" : "Config. Avançadas"}}</a>
      </div>
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
      menu: 1,
      dados: {
        id_chatbot: '',
        nome_bot: 'LeBot',
        icon_bot: '🤖',
        atendimento: '1',
        atendimento_tempo: '1',
        atendimento_msg: '',
        bandeiras: []
      },

      login: {
        email: '',
        senha: ''
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
          // ipcRenderer.send('toggle-wpp', null);
          this.load = false;

        }, res => {
          console.log(res);
          this.load = false;
        });
    },

    logar() {
      if (this.load) {
        return;
      }

      this.load = true;
      this.$http.post('autenticar', this.login)
        .then(res => {
          this.load = false;
          const data = res.data.dados;

          if (data.token) {

            if (localStorage.getItem('token') === data.token) {
              this.$swal("", "Esta ja é a sua empresa atual");

            } else if (this.dados.bandeiras.find(b => b.token === data.token)) {
              this.$swal("", "Empresa já adicionada na lista");

            } else {
              this.dados.bandeiras.push({
                nome_fantasia: data.nome_fantasia,
                token: data.token
              });

              console.log('Empresa conectada: ' + data.token);
              this.$socket.emit('empresa_connected', data.token);

              this.$swal("", "Empresa adicionada com sucesso!");
              this.salvaConfigs();

              this.login.email = '';
              this.login.senha = '';
            }
          }

        }, res => {
          console.log(res);
          this.load = false;
          let msg = res.data.msg;
          this.$swal("", (msg ? msg : 'Erro temporário'));
        });
    },

    removerEmpresa(empresa) {
      this.dados.bandeiras = this.dados.bandeiras.filter(b => b !== empresa);
      this.salvaConfigs();
    }
  },

  mounted() {
    this.token = config.get('key');
    this.getConfigs();
  }
}
</script>

<style>
  .menu {
    margin-right: 14px;
    padding-bottom: 6px;
    display: inline-block;
    color: #1d2124;
  }

  .menu.active, .menu:hover {
    border-bottom: 1px solid var(--success);
    color: var(--success);
  }

  .menu.active {
    font-weight: bold;
  }
</style>
