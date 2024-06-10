import { useEffect, useRef, useState } from "react";
import { InboundMessage } from "./messages/inbound";
import {
  OutboundOfferMessage,
  OutboundAnswerMessage,
} from "./messages/outbound";
import { Client } from "./client";
import ClientComponent from "./components/Client";

function App() {
  const client = new Client("self");
  const [clients, setClients] = useState([client]);
  const clientsRef = useRef(clients);

  function getClient(id: string): Client | undefined {
    return clientsRef.current.find((client) => client.id == id);
  }

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws`);

    ws.onopen = () => {
      console.log("WebSocket connection was opened");
    };

    ws.onmessage = (event) => {
      let message: InboundMessage = JSON.parse(event.data);

      if (message.type === "init") {
        const existingClients: Client[] = message.payload.clients.map(
          (client) => new Client(client.id, new RTCPeerConnection(), ws)
        );
        setClients((clients) => {
          const newClients = [...clients, ...existingClients];
          clientsRef.current = newClients;
          return newClients;
        });
      } else if (message.type === "client_joined") {
        const peerConnection = new RTCPeerConnection();
        const peer = new Client(message.payload.clientId, peerConnection, ws);
        setClients((clients) => {
          const newClients = [...clients, peer];
          clientsRef.current = newClients;
          return newClients;
        });

        peerConnection.createOffer().then((offer) => {
          peerConnection.setLocalDescription(new RTCSessionDescription(offer));
          let offerMessage: OutboundOfferMessage = {
            type: "offer",
            payload: { value: offer, clientId: peer.id },
          };
          ws.send(JSON.stringify(offerMessage));
          console.log("Sent offer message", offerMessage);
        });
      } else if (message.type === "client_left") {
        setClients((clients) => {
          const newClients = clients.filter(
            (client) => client.id !== message.payload.clientId
          );
          clientsRef.current = newClients;
          return newClients;
        });
      } else if (message.type === "offer") {
        console.log("Received offer message", message);

        const client = getClient(message.payload.clientId);
        if (client === undefined) {
          console.log(
            `No client matches given ID: ${message.payload.clientId}`
          );
          return;
        }

        const peerConnection = client.peerConnection!;
        peerConnection.setRemoteDescription(message.payload.value);
        peerConnection.createAnswer().then((answer) => {
          peerConnection.setLocalDescription(new RTCSessionDescription(answer));

          let answerMessage: OutboundAnswerMessage = {
            type: "answer",
            payload: {
              value: answer,
              clientId: message.payload.clientId,
            },
          };
          ws.send(JSON.stringify(answerMessage));
          console.log("Sent answer message", answerMessage);
        });
      } else if (message.type === "answer") {
        console.log("Received answer message", message);

        const client = getClient(message.payload.clientId);
        if (client === undefined) return;

        const peerConnection = client.peerConnection!;
        peerConnection.setRemoteDescription(message.payload.value);
    }
    };

    return () => {
      ws.close();
      clients.forEach((client) => {
        client.peerConnection?.close();
      });
    };
  }, []);

  return (
    <>
      {clients.map((client) => (
        <ClientComponent key={client.id} client={client} />
      ))}
    </>
  );
}

export default App;
