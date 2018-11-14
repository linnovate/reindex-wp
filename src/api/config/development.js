// "use strict";

// const defaultListenPort = 3000;

// const portFromEnv = () => {
//   const x = parseInt(process.env.PORT, 10);
//   /* istanbul ignore next */
//   return (x !== null && !isNaN(x)) ? x : defaultListenPort;
// };

// module.exports = {  
//   "plugins": {
//     "inert": {
//       "enable": true
//     },
//     "electrodeStaticPaths": {
//       "enable": true,
//       "options": {
//         "pathPrefix": "dist"
//       }
//     },
//     "webapp": {
//       "module": "electrode-react-webapp/lib/hapi",
//       "options": {
//         "pageTitle": "402",
//         "paths": {
//           "/{args*}": {
//             "content": {
//               "module": "./server/views/index-view"
//             }
//           }
//         },
//         "devServer": {
// 		    "host": "139.59.208.209",
// 		    "port": "2992"
//   		}
//       }
//     }
//   },
//   "connections": {
//     "default": {
//       "host": process.env.HOST,
//       "address": process.env.HOST_IP || "0.0.0.0",
//       "port": portFromEnv(),
//       "routes": {
//         "cors": true
//       },
//       "state": {
//         "ignoreErrors":true
//       }
//     }
//   },
//   "google": {
//     "client_id": 'client_id',
//     "client_secret": 'client_secret',
//     "redirect_uri": 'redirect_uri',
//   }
// };

module.exports = {
	"elastic": {
		"host": '172.17.0.1',
		"port": "9200"
	},
	"google": {
	    "client_id": "client_id",
	    "client_secret": "client_secret",
	    "redirect_uri": 'redirect_uri'
	}
}
