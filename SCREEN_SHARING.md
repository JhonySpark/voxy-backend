# Compartilhamento de tela: publicação e validação

## Alterações

O frontend usa `screenShareEncoding` (e não `videoEncoding`) para configurar a
transmissão. Isso evita o perfil padrão de tela do SDK (15 FPS / 2,5 Mbps).
Os parâmetros ficam armazenados no LiveKit e são reutilizados em republicações.
Não há ajuste manual de `minBitrate` nem bloqueio da adaptação de resolução.

O perfil Jogos e vídeos prioriza FPS; Texto e documentos prioriza resolução.
Os limites são 2,5/4 Mbps para 720p30/60 e 5/8 Mbps para 1080p30/60.
São tetos, não garantias de banda ou FPS. VP8 continua sendo o padrão; H.264 é
uma alternativa para comparar nas máquinas reais. Hardware encoding depende do
codec negociado, GPU e driver, não apenas das flags do Electron.

Uma única camada continua ativa para não multiplicar a carga de encoding antes
das medições. Simulcast e adaptive stream devem ser avaliados depois, especialmente
quando houver vários espectadores com redes diferentes.

## Configuração do servidor

O workflow deste repositório usa `backend/docker-compose.prod.yml` quando visto
do workspace, ou `docker-compose.prod.yml` na raiz do checkout do backend.
Esse é o Compose completo de produção com Nginx. O Compose da raiz do workspace
é uma alternativa sem Nginx; não executar os dois simultaneamente.

LiveKit está fixado em `v1.13.7` e carrega `/etc/livekit.yaml`, montado a partir
de `docker/livekit/livekit.yaml`. As chaves continuam nas variáveis de ambiente.
O IP público é descoberto por `rtc.use_external_ip`; não há IP fixo no Compose.
Verificar nos logs/candidatos ICE se a descoberta corresponde ao IP público da
Hetzner. Em hosts com múltiplos IPs, configurar explicitamente conforme a versão
do servidor (`--node-ip` / `NODE_IP`) e testar os candidatos anunciados.

No firewall Hetzner e no host, permitir entrada de clientes em:

- UDP 7882: mídia WebRTC multiplexada.
- TCP 7881: alternativa ICE/TCP.
- TCP 443: sinalização TLS pelo Nginx.

Publicar portas no Docker não abre o firewall da Hetzner. A mídia precisa atingir
o IP público diretamente. Cloudflare pode continuar na API/sinalização; seu proxy
HTTP comum não encaminha UDP 7882. Não trocar para DNS-only usando um certificado
Cloudflare Origin como se fosse um certificado publicamente confiável.

TURN não foi ativado automaticamente: precisa de domínio, certificado confiável
e portas disponíveis. Se as métricas mostrarem redes sem acesso UDP/TCP direto,
configurar TURN seguindo a documentação oficial. TURN/TLS em 443 precisa de IP
dedicado ou roteamento TLS apropriado, pois Nginx já ocupa essa porta.

## Aplicação das mudanças

No diretório de produção do servidor, com as variáveis existentes configuradas:

```sh
docker compose -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.prod.yml pull api livekit
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs --tail=100 livekit
docker stats --no-stream voxy_livekit
```

A recriação do LiveKit interrompe as chamadas ativas. Fazer em janela adequada.
O workflow executa a atualização ao receber um push em main; não foi executado
durante a correção local. Para rollback, manter a referência/digest da imagem
anterior e o Compose anterior antes de atualizar.

No frontend, gerar e distribuir um novo instalador; atualizar somente o servidor
não corrige o Electron já instalado. Para um pacote local sem publicação:

```sh
npm run build
npx electron-builder --win --publish never
```

Confirmar que `VITE_LIVEKIT_URL` no ambiente de build aponta para a sinalização
pública correta (normalmente `wss://livekit.d4rkside.com.br`).

## Teste de aceitação

1. Usar dois computadores e o mesmo vídeo/jogo por 60 segundos por perfil.
2. Começar em 720p30, Jogos e vídeos, VP8; repetir em 720p60 e 1080p60.
3. Abrir Diagnóstico no vídeo de quem envia e de quem recebe. O painel só coleta
   enquanto aberto e não envia dados a serviços externos. Valores indisponíveis
   no navegador são omitidos; captura configurada não equivale a FPS medido.
4. Conferir FPS, Mbps reais, resolução, codec, limitação, transporte e perdas.
   Limitação `cpu` aponta para encoding/captura; `bandwidth` aponta para rede.
   Comparar envio e recepção para localizar a etapa afetada. Não exigir FPS alto
   em telas estáticas: o capturador pode evitar quadros repetidos.
5. Se houver limitação de CPU, repetir com H.264 e observar o encoder real.
6. Verificar parar/reiniciar, fechar a janela capturada, minimizar/restaurar,
   sair da sala durante a captura e reconectar. Captura temporariamente muda
   não deve iniciar outra sessão nem encerrar a atual.
7. Repetir com vários espectadores e observar tráfego/CPU do servidor.

Se UDP estiver selecionado mas persistirem perdas/RTT alto, comparar outra rede
do cliente e só então avaliar uma região mais próxima. Uma melhora real de FPS
e qualidade exige esse teste entre clientes; build e testes locais não a provam.

Teste automatizado de regressão, no frontend:

```sh
npm run test:screen-share
```

Ele reproduz o antigo limite de 15 FPS e verifica 16 combinações de configuração
contra a função real do SDK instalado, incluindo as opções usadas na republicação.

Referências:
- https://docs.livekit.io/transport/self-hosting/deployment/
- https://docs.livekit.io/transport/self-hosting/ports-firewall/
- https://github.com/livekit/livekit/releases/tag/v1.13.7
