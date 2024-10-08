import { CreateWebWorkerMLCEngine } from 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm/+esm';

let $ = (el) => document.querySelector(el),
    template = $('#message-template'),
    container = $('#container'),
    progress = $('#progress'),
    loading = $('#loading'),
    outText = $('#outText'),
    inText = $('#inText'),
    btSend = $('#btSend'),
    form = $('#form'),
    messages = [],
    end = false,
    LLM = 'Qwen2-0.5B-Instruct-q0f32-MLC',

    addMessage = (text, sender) => {
        let clonedTemplate = template.content.cloneNode(true),
            message = clonedTemplate.querySelector('.message'),
            span = message.querySelector('span'),
            p = message.querySelector('p');
        p.textContent = text;
        span.textContent = sender === 'ai' ? 'ai' : 'user';
        message.classList.add(sender);
        outText.appendChild(message);
        container.scrollTop = container.scrollHeight;
        return p;
    },

    engine = await CreateWebWorkerMLCEngine(new Worker('./sw.js', { type: 'module' }), LLM, {
        initProgressCallback: (info) => {
            progress.value = info.text.split(/\[|\]|\//)[1] ? info.text.split(/\[|\]|\//)[1] : '0';
            if (!(info.progress === 1 && !end)) return;
            end = true;
            loading?.parentNode?.removeChild(loading);
            inText.disabled = false;
            btSend.disabled = false;
            addMessage('Olá, como posso ajudar?', 'ai');
            inText.focus();
        },
    });

form.onsubmit = async (event) => {
    event.preventDefault();
    let text = inText.value.trim();
    if (!text) return;
    form.reset();
    addMessage(text, 'user');
    inText.disabled = true;
    btSend.disabled = true;
    messages.push({ role: 'user', content: text });
    let chunks = await engine.chat.completions.create({ messages, stream: true }),
        reply = '',
        message = addMessage('', 'ai');
    for await (const chunk of chunks) {
        let choice = chunk.choices[0],
            content = choice?.delta?.content ?? '';
        reply += content;
        message.textContent = reply;
        container.scrollTop = container.scrollHeight;
    }
    inText.disabled = false;
    btSend.disabled = false;
    messages.push({ role: 'assistant', content: reply });
    container.scrollTop = container.scrollHeight;
    inText.focus();
};