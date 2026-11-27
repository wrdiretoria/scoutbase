import styles from './AthletePortrait.module.css'

type Props = { src?: string | null; name: string; initials?: string }
export default function AthletePortrait({ src, name, initials = '?' }: Props) {
  return <div className={styles.frame}><div className={styles.portrait}>
    {src
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={src} alt={`Foto principal de ${name}`} className={styles.photo} />
      : <span className={styles.placeholder}>{initials}</span>}
  </div></div>
}
