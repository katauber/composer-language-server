import * as monaco from 'monaco-editor';
import {
  listen
} from 'vscode-ws-jsonrpc';
import {
  MonacoLanguageClient,
  CloseAction,
  ErrorAction,
  MonacoServices,
  createConnection
} from 'monaco-languageclient';
import ReconnectingWebSocket from 'reconnecting-websocket';
import languageMode from './language-mode';

const EDITOR_CONTENT = `/* Set up the context */
do array('@context')
 add_field('','https://w3id.org/kim/lrmi-profile/draft/context.jsonld')
 do entity('')
  add_field('@language', 'de')
 end
end

map(node.title, name)
map(node.preview.url, image)

/* Default ID: */
do map('node.ref.id', id)
  compose(prefix: 'https://$[service_domain]/edu-sharing/components/render/')
end

/* Replace default ID if we have a ccm:wwwurl */
do map('node.properties.ccm:wwwurl[].1', id)
  trim()
end

do array('mainEntityOfPage')
  do entity('')
    do map('node.ref.id', id)
      compose(prefix: 'https://$[service_domain]/edu-sharing/components/render/')
    end
    /* Add creation/modification date, converting dateTime (e.g. 2019-07-23T09:26:00Z) to date (2019-07-23) */
    do map('node.modifiedAt', 'dateModified')
      replace_all(pattern: 'T.+Z', with: '')
    end
    do map('node.createdAt', 'dateCreated')
      replace_all(pattern: 'T.+Z', with: '')
    end
    /* Add provider/source information to each resource description */
    do entity('provider')
      add_field('id','$[service_id]')
      add_field('type','Service')
      add_field('name','$[service_name]')
    end
  end
end

do map(node.description, description)
  not_equals(string: '')
end

do map('node.properties.ccm:taxonid[].*', '@hochschulfaechersystematik')
  lookup(in: 'data/maps/edusharing-subject-mapping.tsv')
end

do array('about', flushWith: record)
 do entity('', flushWith: '@hochschulfaechersystematik')
  map('@hochschulfaechersystematik', 'id')
  do map('@hochschulfaechersystematik', 'prefLabel.de')
    lookup(in: 'data/maps/subject-labels.tsv')
  end
 end
end

do array('creator', flushWith: record)
 do entity('')
  add_field('type', 'Person')
  map('node.properties.ccm:lifecyclecontributer_authorFN[].*', 'name')
 end
end

do array('sourceOrganization')
 do entity('')
  add_field('type', 'Organization')
  do map('node.properties.ccm:university_DISPLAYNAME[].1', 'name')
    not_equals(string: '')
    not_equals(string: '- Alle -')
  end
 end
end

do map('node.properties.virtual:licenseurl[].1', license)
  replace_all(pattern: '/deed.*$', with: '')
end

do map('node.properties.cclom:general_language[].1', inLanguage)
  replace_all(pattern: '_..$', with: '') /* remove country suffixes eg. _DE */
  replace_all(pattern: '^$', with: 'de') /* empty strings default to 'de' */
  replace_all(pattern: 'unknown', with: 'de')
end

do map('node.properties.ccm:educationallearningresourcetype[].1', '@hcrt')
  lookup(in: 'data/maps/edusharing-hcrt-mapping.tsv')
end

do entity('learningResourceType')
  map('@hcrt', 'id')
  do map('@hcrt', 'prefLabel.de')
    lookup(in: 'data/maps/hcrt-labels.tsv')
  end
end

/* Enable to see what else is coming in from the source: */
/* map(_else) */`;

const LANGUAGE_ID = 'fix';

const guid = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

const createLanguageClient = connection => new MonacoLanguageClient({
  name: 'Composer Expressions Language Client',
  clientOptions: {
    documentSelector: [LANGUAGE_ID],
    errorHandler: {
      error: () => ErrorAction.Continue,
      closed: () => CloseAction.DoNotRestart
    }
  },
  connectionProvider: {
    get: (errorHandler, closeHandler) => Promise.resolve(createConnection(connection, errorHandler, closeHandler))
  }
});

const createUrl = (host, port, path) => `${location.protocol === 'https:' ? 'wss' : 'ws'}://${host}:${port}${path}`;

const createWebSocket = url => new ReconnectingWebSocket(url, undefined, {
  maxReconnectionDelay: 10000,
  minReconnectionDelay: 1000,
  reconnectionDelayGrowFactor: 1.3,
  connectionTimeout: 10000,
  maxRetries: Infinity,
  debug: false
});

monaco.languages.register({
  id: LANGUAGE_ID,
  aliases: [
    LANGUAGE_ID
  ],
  extensions: [`.${LANGUAGE_ID}`],
  mimetypes: [
    `text/${LANGUAGE_ID}`
  ]
});
monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, languageMode);

monaco.editor.create(document.getElementById('container'), {
  model: monaco.editor.createModel(EDITOR_CONTENT, LANGUAGE_ID, monaco.Uri.parse(`inmemory:/demo/${guid()}.${LANGUAGE_ID}`))
});

MonacoServices.install(monaco);

listen({
  webSocket: createWebSocket(createUrl('localhost', '4389', '/')),
  onConnection: connection => {
    const languageClient = createLanguageClient(connection).start();
    connection.onClose(() => languageClient.dispose());
  }
});