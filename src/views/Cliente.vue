<template>
  <div class="container-fluid mb-4">
    <div v-show="!load">
      <div class="mt-2" v-if="dados.id_cliente">
        <h4 class="font-weight-bold">
          {{dados.nome_cliente}}
        </h4>

        <modal-menu :menus="menus" :selected="menu" @changeMenu="(m) => {this.menu = m}"/>

        <div v-show="menu === 1">
          <div class="mb-3" v-show="dados.tags.length || dados.is_new === '1'">
            <h6 class="font-weight-bold mb-1" @click="etiqueta = true">Etiquetas</h6>
            <div class="d-flex flex-wrap mb-2">
              <div class="badge badge-info p-2 mr-2 mb-1" v-if="dados.is_new === '1'">
                Novo
              </div>
              <div class="badge pointer p-2 mr-2 mb-1" v-for="t in dados.tags" :class="'badge-' + t.color" @click="menu = 3">
                {{t.nome_tag}}
              </div>
              <div class="badge badge-light pointer p-2" @click="menu = 3">
                <i class="fa fa-plus"></i>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-12">
              <div class="form-group">
                <label class="font-weight-bold mb-0">Nome Completo</label>
                <div class="form-control">{{dados.nome_cliente}}</div>
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="font-weight-bold mb-0">Telefone</label>
                <the-mask typeof="number" :mask="['(##) ####-####', '(##) #####-####']" class="form-control" v-model="dados.telefone" disabled/>
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="font-weight-bold mb-0">Data de Cadastro</label>
                <div class="form-control">{{dados.created_at}}</div>
              </div>
            </div>
          </div>
          <div v-show="dados.enderecos.length">
            <hr>
            <h6 class="font-weight-bold">Endereços</h6>
            <ul class="list-group">
              <li class="list-group-item" v-for="e in dados.enderecos">
                <i class="fa fa-map-marker-alt mr-2"></i> {{e.logradouro}}, {{e.numero}}, {{e.bairro}} - {{e.cep}}
                <span class="badge badge-dark float-right" v-if="dados.endereco_default === e.id_endereco">Padrão</span>
              </li>
            </ul>
          </div>

          <div class="small my-2">Cod: {{dados.id_cliente}}</div>
        </div>

        <div v-show="menu === 2">
          <div class="row mb-2">
            <div class="col-6">
              <div class="form-group">
                <label class="font-weight-bold mb-0">Nº de Pedidos</label>
                <div class="form-control">{{dados.qtd_pedido > 0 ? dados.qtd_pedido : '-'}}</div>
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="font-weight-bold mb-0">Último Pedido</label>
                <div class="form-control" style="white-space: nowrap">{{dados.ultimo_pedido ? dados.ultimo_pedido : '-'}}</div>
              </div>
            </div>
          </div>
          <div class="card table-responsive" v-if="dados.pedidos.length">
            <div class="card-body" style="max-height: 55vh; overflow: auto">
              <table class="table">
                <thead class="border-bottom">
                <tr>
                  <th>Pedido</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="p in dados.pedidos">
                  <td>{{p.id_pedido}}</td>
                  <td>{{p.data_pedido}}</td>
                  <td>{{p.status === '5' ? 'Cancelado' : 'Processado'}}</td>
                  <td>R$ {{p.valor_total}}</td>
                </tr>
                </tbody>
              </table>
              <span v-if="dados.pedidos.length === 50">* Últimos 50 pedidos</span>
            </div>
          </div>
        </div>

        <div v-show="menu === 3">
          <div class="mb-3">
            <h6 class="font-weight-bold mb-1 pointer" @click="etiqueta = true">Etiquetas</h6>
            <div class="mb-2" style="max-width: 250px">
              <div class="mb-2 text-white p-2 rounded-sm small pointer d-flex justify-content-between align-items-center"
                   v-for="t in tags"
                   :class="'bg-' + t.color" @click="toggleTag(t)">
                {{t.nome_tag}}
                <i class="fa fa-check ml-1 pointer" v-if="dados.tags.find(tag => tag.id_tag === t.id_tag)"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div class="container text-center" style="margin-top: 100px">
          <div class="mb-4">
            <img src="../assets/logo-zap.png" alt="Logo Lecard" style="width: 64px; border-radius: 6px">
          </div>
          <h6>Nenhum pedido realizado</h6>
          <p>Este cliente ainda não realizou nenhum pedido. Assim que fizer, seus dados irão aparecer nesta tela.</p>
        </div>
      </div>
    </div>

    <loading v-show="load"/>

  </div>
</template>

<script>
  import ModalMenu from "../components/ModalMenu";
  import Loading from "../components/Loading";
  const Config = require('electron-config');
  const config = new Config();

  export default {
    name: 'Cliente',
    components: {Loading, ModalMenu},
    data() {
      return {
        token: '',
        load: true,
        menus: [
          { nome: 'Dados', active: true },
          { nome: 'Pedidos', active: true },
          { nome: 'Etiquetas', active: true },
        ],
        menu: 1,

        dados: {
          enderecos: [],
          pedidos: [],
          tags: []
        },

        tags: [
          { nome_tag: 'Especial', id_tag: '1', color: 'success' },
          { nome_tag: 'Delicado', id_tag: '2', color: 'warning' }
        ],

        alterarSenha: '',
        etiqueta: false
      }
    },

    methods: {
      getCliente() {
        const id = this.$route.params.id;
        this.load = true;
        this.menu = 1;

        this.$http.get('clientes/id/' + this.token + '?id_chatbot=' + id).then(res => {
          if (res.data && res.data.id_cliente) {
            this.dados = res.data;

          } else {
            this.clear();
          }

          this.load = false;

        }, res => {
          this.load = false;
          this.$swal(res.data.msg);
        });
      },

      clear() {
        this.dados = {
          enderecos: [],
          pedidos: [],
          tags: []
        }
      },

      salvalTag() {
        const dados = {
          id_cliente: this.dados.id_cliente,
          tags: this.dados.tags,
        };

        this.$http.post('clientes/tags/' + this.token, dados)
          .then(res => {}, res => {
            this.$swal(res.data.msg);
          });
      },

      toggleTag(t) {
        if (!this.dados.tags.find(tag => tag.id_tag === t.id_tag)) {
          this.dados.tags.push({
            nome_tag: t.nome_tag,
            id_tag: t.id_tag,
            color: t.color,
          })

        } else {
          this.dados.tags = this.dados.tags.filter(tag => tag.id_tag !== t.id_tag)
        }

        this.salvalTag();
      }
    },

    mounted() {
      this.token = config.get('key');
      this.getCliente();
    },

    created() {
      this.$parent.$on('reloadDados', () => {
        this.getCliente();
      })
    }
  }
</script>
