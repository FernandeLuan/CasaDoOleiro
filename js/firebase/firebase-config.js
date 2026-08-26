/* Configuração pública do app Web do Firebase.
 *
 * O firebaseConfig do SDK Web não concede acesso aos dados por si só. A proteção
 * depende de Authentication + Firestore Security Rules e das restrições da API key.
 *
 * Durante a preparação do backend este arquivo permanece sem a chave versionada
 * para evitar alertas de secret scanning no GitHub. A configuração será injetada
 * no deploy quando fecharmos a publicação do backend.
 */
window.OLEIRO_FIREBASE_CONFIG = null;
