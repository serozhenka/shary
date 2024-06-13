import { useEffect, useRef, useState } from "react";
import { InboundMessage } from "./messages/inbound";
import {
  OutboundOfferMessage,
  OutboundAnswerMessage,
} from "./messages/outbound";
import { Client } from "./client";
import ClientComponent from "./components/Client";
import { Xid } from "xid-ts";

function App() {
  const client = new Client({ id: "self", isPolite: false });
  const [clients, setClients] = useState([client]);
  const clientsRef = useRef(clients);
  const [isVideoEnabled, setVideoEnabled] = useState(true);

  const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

  function getClient(id: string): Client | undefined {
    return clientsRef.current.find((client) => client.id == id);
  }

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws`);

    ws.onopen = () => {
      console.log("WebSocket connection was opened");
    };

    ws.onmessage = async (event) => {
      let message: InboundMessage = JSON.parse(event.data);

      if (message.type === "init") {
        console.log("Init message", message.payload.clients.length);
        const existingClients: Client[] = message.payload.clients.map(
          (client) =>
            new Client({
              id: client.id,
              isPolite: true,
              peerConnection: new RTCPeerConnection(config),
              ws: ws,
            })
        );
        setClients((clients) => {
          const newClients = [...clients, ...existingClients];
          clientsRef.current = newClients;
          return newClients;
        });
      } else if (message.type === "client_joined") {
        console.clear();
        const pc = new RTCPeerConnection(config);
        const peer = new Client({
          id: message.payload.clientId,
          isPolite: false,
          peerConnection: pc,
          ws: ws,
        });
        setClients((clients) => {
          const newClients = [...clients, peer];
          clientsRef.current = newClients;
          return newClients;
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(new RTCSessionDescription(offer));
        let offerMessage: OutboundOfferMessage = {
          type: "offer",
          payload: {
            messageId: new Xid().toString(),
            value: offer,
            clientId: peer.id,
          },
        };
        ws.send(JSON.stringify(offerMessage));
        console.log("Sent offer message", offerMessage.payload);
      } else if (message.type === "client_left") {
        setClients((clients) => {
          const newClients = clients.filter(
            (client) => client.id !== message.payload.clientId
          );
          clientsRef.current = newClients;
          return newClients;
        });
      } else if (message.type === "offer") {
        console.log("Received offer message", message.payload);

        const client = getClient(message.payload.clientId);
        if (client === undefined) {
          console.log(
            `No client matches given ID: ${message.payload.clientId}`
          );
          return;
        }

        const pc = client.peerConnection!;
        const offerCollision =
          client.makingOffer || pc.signalingState != "stable";
        const ignoreOffer = offerCollision && !client.isPolite;
        if (ignoreOffer) {
          console.log(`Impolite peer: ${client.id}. Ignoring answer`);
          return;
        }

        try {
          await pc.setRemoteDescription(message.payload.value);
          await pc.setLocalDescription();
        } catch (err) {
          console.error(err);
          return;
        }

        let answerMessage: OutboundAnswerMessage = {
          type: "answer",
          payload: {
            messageId: new Xid().toString(),
            value: pc.localDescription!,
            clientId: message.payload.clientId,
          },
        };

        ws.send(JSON.stringify(answerMessage));
        console.log("Sent answer message", answerMessage.payload);
      } else if (message.type === "answer") {
        console.log("Received answer message", message.payload);

        const client = getClient(message.payload.clientId);
        if (client === undefined) return;

        const pc = client.peerConnection!;
        try {
          await pc.setRemoteDescription(message.payload.value);
        } catch (err) {
          console.error(err);
          return;
        }
      } else if (message.type === "iceCandidate") {
        console.log("Received ice candidate message", message.payload);

        // const client = getClient(message.payload.clientId);
        // if (client === undefined) return;
        // const pc = client.peerConnection!;

        // const offerCollision =
        //   client.makingOffer || pc.signalingState !== "stable";
        // const ignoreOffer = !client.isPolite && offerCollision;

        // try {
        //   await client.peerConnection!.addIceCandidate(message.payload.value);
        //   console.log(`Added ICE candidate, client id: ${client.id}`);
        // } catch (err) {
        //   console.error("HERE", err);
        //   if (!ignoreOffer) {
        //     console.error(err);
        //   }
        // }
      }
    };

    return () => {
      clients.forEach((client) => {
        client.peerConnection?.close();
      });
      ws.close();
    };
  }, []);

  return (
    <>
      <div className="d-flex">
        {clients.map((client) => (
          <ClientComponent
            key={client.id}
            client={client}
            isVideoEnabled={isVideoEnabled}
          />
        ))}
      </div>
      <button
        onClick={() => {
          setVideoEnabled((current) => !current);
        }}
        className={"btn btn-primary"}
      >
        Toogle video
      </button>
    </>
  );
}

export default App;
