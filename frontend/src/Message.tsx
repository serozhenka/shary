interface MessageProps {
    name: string;
}

function Message(props: MessageProps) {
    return <h1>Hello {props.name}</h1>;
}

export default Message;