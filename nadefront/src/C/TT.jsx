const throwTypes = [
  {
    id: "LMB",
    icon: (
      <svg width="20" height="12" viewBox="3 -4 24 24" fill="none">
        <path
          d="M 0 15 C 0 6 0 0 15 0 C 30 0 30 6 30 15 L 30 15 L 18 15 
             C 18 11 18 10 15 10 C 12 10 12 11 12 15 L 0 15 L 18 15"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M 0 15 C 0 6 0 0 15 0 L 15 10 C 12 10 12 11 12 15 L 0 15"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "RMB",
    icon: (
      <svg width="20" height="12" viewBox="3 -4 24 24" fill="none">
        <path
          d="M 0 15 C 0 6 0 0 15 0 C 30 0 30 6 30 15 L 30 15 L 18 15 
             C 18 11 18 10 15 10 C 12 10 12 11 12 15 L 0 15 L 18 15"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M 30 15 C 30 6 30 0 15 0 L 15 10 C 18 10 18 13 18 15 L 30 15"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "MMB",
    icon: (
      <svg width="20" height="12" viewBox="3 -4 24 24" fill="none">
        <path
          d="M 0 15 C 0 6 0 0 15 0 C 30 0 30 6 30 15 L 30 15 L 18 15 
             C 18 11 18 10 15 10 C 12 10 12 11 12 15 L 0 15 L 18 15"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M 0 15 C 0 6 0 0 14 0 L 14 10 C 12 10 12 11 12 15 L 0 15 
             M 16 10 C 18 10 18 11 18 15 L 30 15 C 30 6 30 0 16 0 L 16 10"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "JUMP",
    icon: <span className="font-bold">JUMP</span>,
  },
];

export default throwTypes;