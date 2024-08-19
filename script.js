import { CreateWebWorkerMLCEngine } from 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/+esm';

window.onload = async () => {
    let $ = (el) => document.querySelector(el),
        form = $('#form'),
        inText = $('#inText'),
        template = $('#message-template'),
        outText = $('#outText'),
        container = $('#container'),
        btSend = $('#btSend'),
        outInfo = $('#outInfo'),
        loading = $('#loading'),
        progress = $('#progress'),
        SELECTED_MODEL = 'Llama-3-8B-Instruct-q4f16_1-MLC',
        messages = [],
        end = false,

        addMessage = (text, sender) => {
            let clonedTemplate = template.content.cloneNode(true),
                $newMessage = clonedTemplate.querySelector('.message'),
                $who = $newMessage.querySelector('span'),
                $text = $newMessage.querySelector('p');

            $text.textContent = text;
            $who.textContent = sender === 'bot' ? 'IA' : 'Você';
            $newMessage.classList.add(sender);

            outText.appendChild($newMessage);

            container.scrollTop = container.scrollHeight;

            return $text;
        },

        engine = await CreateWebWorkerMLCEngine(new Worker('./worker.js', { type: 'module' }), SELECTED_MODEL, {
            initProgressCallback: (info) => {
                outInfo.textContent = info.text;
                if (info.text.split(/\[|\]|\//)[1])
                    progress.value = info.text.split(/\[|\]|\//)[1];
                if (info.progress === 1 && !end) {
                    end = true;
                    loading?.parentNode?.removeChild(loading);
                    inText.removeAttribute('disabled');
                    btSend.removeAttribute('disabled');
                    addMessage('Olá, como posso ajudar?', 'bot');
                    inText.focus();
                }
            },
        }
        );

    form.onsubmit = async (event) => {
        event.preventDefault();
        let text = inText.value.trim();

        if (text !== '')
            inText.value = '';

        addMessage(text, 'user');
        btSend.setAttribute('disabled', '');

        messages.push({ role: 'user', content: text });

        let chunks = await engine.chat.completions.create({ messages, stream: true }),
            reply = '',
            $botMessage = addMessage('', 'bot');

        for await (const chunk of chunks) {
            let choice = chunk.choices[0],
                content = choice?.delta?.content ?? '';
            reply += content;
            $botMessage.textContent = reply;
        }

        btSend.removeAttribute('disabled');
        messages.push({ role: 'assistant', content: reply });
        container.scrollTop = container.scrollHeight;
    };
};