import { Post } from './Post';
import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    OneToMany, 
    ManyToMany, 
    OneToOne, 
    JoinTable, 
    JoinColumn 
} from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column({ nullable: true })
    name!: string;

    @Column({ default: 'ROLE_USER' })
    roles!: string; // Stocké en string, ex: "ROLE_USER,ROLE_ADMIN"

    @OneToMany(() => Post, (post) => post.author)
    posts: Post[];
}