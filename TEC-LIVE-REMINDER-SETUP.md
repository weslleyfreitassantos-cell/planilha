# Integração de lembretes da planilha com o TecLive

O projeto da planilha já foi preparado para executar uma verificação diária no Cloudflare às 09:00 no horário de Brasília (12:00 UTC).

Quando houver um lançamento com a data do dia, o Cloudflare enviará um `POST` para:

`https://livemonitor.vps-kinghost.net/api/planilha/reminders`

O endpoint precisa ser criado no TecLive usando o módulo de e-mail existente em `alerts/emailAlerts.js`.

## Endpoint sugerido para o TecLive

Adicionar uma rota autenticada ao Express:

```js
app.post('/api/planilha/reminders', async (req, res) => {
  if (req.get('x-reminder-secret') !== process.env.PLANILHA_REMINDER_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { action, client, amount, date, type } = req.body || {};
  if (!action || !client || !amount || !date || !type) {
    return res.status(400).json({ error: 'invalid payload' });
  }

  const subject = `${action} hoje - ${client} - R$ ${Number(amount).toFixed(2).replace('.', ',')}`;
  const message = [
    'Lembrete do Controle de Clientes',
    '',
    `${action}: ${client}`,
    `Valor: R$ ${Number(amount).toFixed(2).replace('.', ',')}`,
    `Data: ${date}`,
    `Tipo: ${type === 'receber' ? 'Recebimento de cliente' : 'Pagamento/gasto'}`
  ].join('\n');

  try {
    await emailAlerts.sendEmailAlert(subject, message, 'planilha_reminder');
    return res.json({ ok: true });
  } catch (error) {
    console.error('[PLANILHA] erro ao enviar lembrete:', error.message);
    return res.status(500).json({ error: 'email failed' });
  }
});
```

O arquivo da rota precisa ter acesso à instância `emailAlerts` já criada pelo TecLive. O nome da variável pode ser ajustado conforme o `app.js`.

## Segredo compartilhado

Criar um segredo aleatório e definir o mesmo valor nos dois ambientes:

```bash
# No TecLive/VPS
PLANILHA_REMINDER_SECRET=COLOQUE_UM_SEGREDO_FORTE_AQUI

# No Cloudflare Worker
npx wrangler secret put REMINDER_SECRET
```

Não colocar esse segredo no GitHub, no `wrangler.toml` ou no código-fonte.

O payload enviado pelo Cloudflare contém `action` (Receber/Pagar), `client`, `amount`, `date` e `type`. O Cloudflare registra cada lembrete enviado para não duplicar o e-mail no mesmo dia.
