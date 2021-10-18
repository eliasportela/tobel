<template>
  <div class="container-fluid my-3">
    <div v-if="!load">
      <modal-menu :menus="menus" :selected="menu" @changeMenu="(m) => {this.menu = m}"/>

      <div v-show="menu === 1">
        <form @submit.prevent="salvaConfigs()">
          <div class="row">
            <div class="col-12 mb-2">
              <div class="custom-control custom-checkbox">
                <input type="checkbox" class="custom-control-input" id="boasvindas" @change="toggleMsgBoasVindas" :checked="dados.msg_boasvindas !== null">
                <label class="custom-control-label" for="boasvindas">Habilitar mensagem de boas-vindas</label>
              </div>
              <div v-if="dados.msg_boasvindas !== null">
              <textarea id="msg_boasvindas" class="form-control" v-model="dados.msg_boasvindas" rows="4" style="resize: none"
                        placeholder="Configure uma mensagem inicial para seu cliente" required></textarea>
                <label class="small font-weight-bold mt-1">Mensagem automática de boas-vindas para o cliente</label>
              </div>
            </div>
            <div class="col-12 mb-2">
              <div class="custom-control custom-checkbox">
                <input type="checkbox" class="custom-control-input" id="reserva" @change="toggleMsgReserva" :checked="dados.msg_reserva !== null">
                <label class="custom-control-label" for="reserva">Habilitar reservas de mesas ou encomendas</label>
              </div>
              <div v-if="dados.msg_reserva !== null">
              <textarea id="msg_reserva" class="form-control" v-model="dados.msg_reserva" rows="4" style="resize: none"
                        placeholder="Informe a mensagem de resposta para solicitações de reservas/encomendas" required></textarea>
                <label class="small font-weight-bold mt-1">Mensagem para solicitações de reservas/encomendas</label>
              </div>
            </div>
            <div class="col-12 mb-2">
              <div class="custom-control custom-checkbox">
                <input type="checkbox" class="custom-control-input" id="atendimento" @change="dados.atendimento = dados.atendimento === '1' ? '0' : '1'" :checked="dados.atendimento === '1'">
                <label class="custom-control-label" for="atendimento">Habilitar atendimento humano</label>
              </div>
              <div v-if="dados.atendimento === '1'">
                <input type="number" id="atendimentoTempo" class="form-control w-25" v-model="dados.atendimento_tempo" placeholder="Minutos">
                <label class="small mt-1 font-weight-bold" for="atendimentoTempo">Configure os minutos para esperar por um atendente</label>
              </div>
              <div v-else>
              <textarea id="atendimentoMsg" class="form-control" v-model="dados.atendimento_msg" rows="4"
                        placeholder="Caso você acredite que precisa de uma pessoa para lhe auxiliar, tente entrar em contato através do nosso telefone: (35) 92222-2222"
                        style="resize: none"></textarea>
                <label class="small font-weight-bold mt-1">Resposta automática para solicitações de atendentes</label>
              </div>
            </div>
          </div>
          <hr>
          <div>
            <button class="btn btn-success btn-block" type="submit">Salvar</button>
          </div>
        </form>
      </div>
      <div v-show="menu === 2">
        <form action="">
          <div class="row">
            <div class="col-6 mb-2">
              <label class="small mb-0 font-weight-bold" for="nomeBot">Nome</label>
              <input type="text" id="nomeBot" class="form-control" v-model="dados.nome_bot" placeholder="Nome customizado do BOT" required>
            </div>
            <div class="col-6 mb-2">
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
          </div>
          <hr>
          <div>
            <button class="btn btn-success btn-block" type="submit">Salvar</button>
          </div>
        </form>
      </div>
      <div v-show="menu === 3">
        <h6 class="font-weight-bold mt-4 mb-3 text-center">Adicionar Empresa</h6>
        <form @submit.prevent="logar()">
          <div class="mb-2">
            <label class="small mb-0 font-weight-bold" for="email">Usuário</label>
            <input type="text" id="email" class="form-control" v-model="login.email" placeholder="Email" required>
          </div>
          <div class="mb-3">
            <label class="small mb-0 font-weight-bold" for="senha">Senha</label>
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
    </div>
    <loading v-else/>
  </div>
</template>

<script>
import Loading from "../components/Loading";
import ModalMenu from "../components/ModalMenu";
const { ipcRenderer } = require('electron');
const Config = require('electron-config');
const config = new Config();

export default {
  name: 'Login',
  components: {ModalMenu, Loading},
  data() {
    return {
      token: '',
      load: true,

      menus: [
        { nome: 'Dados', active: true },
        { nome: 'Chatbot', active: true },
        { nome: 'Franquia', active: true }
      ],
      menu: 1,

      dados: {
        id_chatbot: '',
        nome_bot: 'LeBot',
        icon_bot: '🤖',
        msg_reserva: null,
        msg_boasvindas: null,
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

          this.$swal("Dados salvos com sucesso!")

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
              this.$swal("Esta ja é a sua empresa atual");

            } else if (this.dados.bandeiras.find(b => b.token === data.token)) {
              this.$swal("Empresa já adicionada na lista");

            } else {
              this.dados.bandeiras.push({
                nome_fantasia: data.nome_fantasia,
                token: data.token
              });

              console.log('Empresa conectada: ' + data.token);
              this.$socket.emit('empresa_connected', data.token);

              this.$swal("Empresa adicionada com sucesso!");
              this.salvaConfigs();

              this.login.email = '';
              this.login.senha = '';
            }
          }

        }, res => {
          console.log(res);
          this.load = false;
          let msg = res.data.msg;
          this.$swal((msg ? msg : 'Erro temporário'));
        });
    },

    removerEmpresa(empresa) {
      this.dados.bandeiras = this.dados.bandeiras.filter(b => b !== empresa);
      this.salvaConfigs();
    },

    toggleMsgBoasVindas() {
      this.dados.msg_boasvindas = this.dados.msg_boasvindas === null ? "" : null;
    },

    toggleMsgReserva() {
      if (this.dados.msg_reserva === null) {
        this.dados.msg_reserva = 'Para adiantar seu atendimento, por favor informe:\n' +
          '- A reserva é para que dia e horário?\n' +
          '- Quantas pessoas?';
      } else {
        this.dados.msg_reserva = null;
      }
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
