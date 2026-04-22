import React from 'react';
import { useParams } from 'react-router-dom';

export default function GroupDetails() {
  const { groupId } = useParams();
  return <h2>Group Details for Group ID: {groupId}</h2>;
} 