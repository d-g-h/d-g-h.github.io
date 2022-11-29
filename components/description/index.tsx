type DescriptionProps = {
  description: string
}

export default function Description({ description }: DescriptionProps) {
  return (
    <li>
      {description}
    </li>
  )
}
