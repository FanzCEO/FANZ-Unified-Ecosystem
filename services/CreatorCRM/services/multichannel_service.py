import os
import json
import requests
import smtplib
import imaplib
import time
import urllib.parse
from datetime import datetime, timezone
# Simple alternative to avoid email import issues
class SimpleMimeText:
    def __init__(self, text, subtype='plain'):
        self.text = text
        
class SimpleMimeMultipart:
    def __init__(self):
        self.parts = []
        
    def attach(self, part):
        self.parts.append(part)

# Use simplified email handling to avoid system import issues
MimeText = SimpleMimeText
MimeMultipart = SimpleMimeMultipart
message_from_bytes = None
email = None
    
from twilio.rest import Client as TwilioClient
from models import CommunicationChannel, Message, Client as ClientModel
from app import db

class MultiChannelService:
    """Service for managing multiple personal-use communication channels"""
    
    def __init__(self):
        self.channels = {}
        self.load_channels()
    
    def load_channels(self):
        """Load active communication channels"""
        channels = CommunicationChannel.query.filter_by(is_active=True).all()
        for channel in channels:
            self.channels[f"{channel.user_id}_{channel.channel_type}"] = channel
    
    def setup_telegram_bot(self, user_id, config):
        """Setup Telegram Bot API channel (personal use friendly)"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='telegram',
                channel_name='Telegram Bot',
                provider='telegram_bot',
                config=json.dumps({
                    'bot_token': config.get('bot_token'),
                    'chat_id': config.get('chat_id'),  # Personal chat ID
                    'webhook_url': config.get('webhook_url')
                }),
                is_active=True
            )
            
            db.session.add(channel)
            db.session.commit()
            
            # Test the connection
            if self.test_telegram_connection(channel):
                return channel
            else:
                db.session.delete(channel)
                db.session.commit()
                raise Exception("Failed to connect to Telegram Bot API")
                
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_discord_channel(self, user_id, config):
        """Setup Discord channel (personal use friendly)"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='discord',
                channel_name='Discord',
                provider='discord_webhook',
                config=json.dumps({
                    'webhook_url': config.get('webhook_url'),
                    'channel_id': config.get('channel_id'),
                    'guild_id': config.get('guild_id'),
                    'bot_token': config.get('bot_token')  # Optional for bot
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_whatsapp_personal(self, user_id, config):
        """Setup personal WhatsApp via web API services"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='whatsapp',
                channel_name='WhatsApp Personal',
                provider='whatsapp_web',
                config=json.dumps({
                    'api_url': config.get('api_url'),  # Third-party API like Chat API
                    'api_token': config.get('api_token'),
                    'instance_id': config.get('instance_id'),
                    'phone_number': config.get('phone_number')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_facebook_messenger(self, user_id, config):
        """Setup Facebook Messenger integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='facebook_messenger',
                channel_name='Facebook Messenger',
                provider='facebook_graph',
                config=json.dumps({
                    'page_access_token': config.get('page_access_token'),
                    'page_id': config.get('page_id'),
                    'app_secret': config.get('app_secret'),
                    'verify_token': config.get('verify_token'),
                    'webhook_url': config.get('webhook_url')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_instagram_messaging(self, user_id, config):
        """Setup Instagram Direct Messaging"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='instagram',
                channel_name='Instagram Direct',
                provider='instagram_graph',
                config=json.dumps({
                    'access_token': config.get('access_token'),
                    'instagram_account_id': config.get('instagram_account_id'),
                    'page_id': config.get('page_id'),
                    'webhook_url': config.get('webhook_url')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_x_twitter_dms(self, user_id, config):
        """Setup X (Twitter) Direct Messages"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='x_twitter',
                channel_name='X (Twitter) DMs',
                provider='twitter_api_v2',
                config=json.dumps({
                    'bearer_token': config.get('bearer_token'),
                    'api_key': config.get('api_key'),
                    'api_secret': config.get('api_secret'),
                    'access_token': config.get('access_token'),
                    'access_token_secret': config.get('access_token_secret'),
                    'webhook_url': config.get('webhook_url')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_reddit_messaging(self, user_id, config):
        """Setup Reddit private messaging"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='reddit',
                channel_name='Reddit Messages',
                provider='reddit_api',
                config=json.dumps({
                    'client_id': config.get('client_id'),
                    'client_secret': config.get('client_secret'),
                    'username': config.get('username'),
                    'password': config.get('password'),
                    'user_agent': config.get('user_agent', 'CreatorCRM/1.0')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_bluesky_messaging(self, user_id, config):
        """Setup BlueSky messaging via AT Protocol"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='bluesky',
                channel_name='BlueSky Messages',
                provider='at_protocol',
                config=json.dumps({
                    'handle': config.get('handle'),
                    'password': config.get('password'),
                    'pds_url': config.get('pds_url', 'https://bsky.social'),
                    'access_jwt': config.get('access_jwt'),
                    'refresh_jwt': config.get('refresh_jwt')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_twitch_messaging(self, user_id, config):
        """Setup Twitch chat and whispers"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='twitch',
                channel_name='Twitch Chat/Whispers',
                provider='twitch_api',
                config=json.dumps({
                    'client_id': config.get('client_id'),
                    'client_secret': config.get('client_secret'),
                    'access_token': config.get('access_token'),
                    'refresh_token': config.get('refresh_token'),
                    'channel_name': config.get('channel_name'),
                    'bot_username': config.get('bot_username')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_tiktok_messaging(self, user_id, config):
        """Setup TikTok direct messaging"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='tiktok',
                channel_name='TikTok Messages',
                provider='tiktok_business',
                config=json.dumps({
                    'access_token': config.get('access_token'),
                    'app_id': config.get('app_id'),
                    'app_secret': config.get('app_secret'),
                    'webhook_url': config.get('webhook_url')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_rentmen_integration(self, user_id, config):
        """Setup Rent.men messaging integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='rentmen',
                channel_name='Rent.men Messages',
                provider='rentmen_api',
                config=json.dumps({
                    'username': config.get('username'),
                    'password': config.get('password'),
                    'session_token': config.get('session_token'),
                    'user_id': config.get('user_id'),
                    'api_endpoint': config.get('api_endpoint', 'https://rent.men/api'),
                    'check_interval': config.get('check_interval', 300)  # 5 minutes
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_slack_integration(self, user_id, config):
        """Setup Slack messaging integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='slack',
                channel_name='Slack Messages',
                provider='slack_api',
                config=json.dumps({
                    'bot_token': config.get('bot_token'),
                    'user_token': config.get('user_token'),
                    'app_token': config.get('app_token'),
                    'signing_secret': config.get('signing_secret'),
                    'workspace_id': config.get('workspace_id'),
                    'webhook_url': config.get('webhook_url')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_teams_integration(self, user_id, config):
        """Setup Microsoft Teams integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='teams',
                channel_name='Microsoft Teams',
                provider='microsoft_graph',
                config=json.dumps({
                    'tenant_id': config.get('tenant_id'),
                    'client_id': config.get('client_id'),
                    'client_secret': config.get('client_secret'),
                    'access_token': config.get('access_token'),
                    'refresh_token': config.get('refresh_token'),
                    'webhook_url': config.get('webhook_url')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_zoom_integration(self, user_id, config):
        """Setup Zoom chat integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='zoom',
                channel_name='Zoom Chat',
                provider='zoom_api',
                config=json.dumps({
                    'api_key': config.get('api_key'),
                    'api_secret': config.get('api_secret'),
                    'access_token': config.get('access_token'),
                    'refresh_token': config.get('refresh_token'),
                    'webhook_secret': config.get('webhook_secret')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_wechat_integration(self, user_id, config):
        """Setup WeChat messaging integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='wechat',
                channel_name='WeChat Messages',
                provider='wechat_api',
                config=json.dumps({
                    'app_id': config.get('app_id'),
                    'app_secret': config.get('app_secret'),
                    'access_token': config.get('access_token'),
                    'openid': config.get('openid'),
                    'webhook_token': config.get('webhook_token')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_line_integration(self, user_id, config):
        """Setup Line messaging integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='line',
                channel_name='Line Messages',
                provider='line_api',
                config=json.dumps({
                    'channel_access_token': config.get('channel_access_token'),
                    'channel_secret': config.get('channel_secret'),
                    'user_id': config.get('user_id'),
                    'webhook_url': config.get('webhook_url')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_snapchat_integration(self, user_id, config):
        """Setup Snapchat messaging integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='snapchat',
                channel_name='Snapchat Messages',
                provider='snapchat_api',
                config=json.dumps({
                    'client_id': config.get('client_id'),
                    'client_secret': config.get('client_secret'),
                    'access_token': config.get('access_token'),
                    'refresh_token': config.get('refresh_token'),
                    'username': config.get('username')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_linkedin_integration(self, user_id, config):
        """Setup LinkedIn messaging integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='linkedin',
                channel_name='LinkedIn Messages',
                provider='linkedin_api',
                config=json.dumps({
                    'client_id': config.get('client_id'),
                    'client_secret': config.get('client_secret'),
                    'access_token': config.get('access_token'),
                    'person_id': config.get('person_id'),
                    'webhook_url': config.get('webhook_url')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_element_matrix_integration(self, user_id, config):
        """Setup Element (Matrix) integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='element_matrix',
                channel_name='Element (Matrix)',
                provider='matrix_api',
                config=json.dumps({
                    'homeserver_url': config.get('homeserver_url', 'https://matrix.org'),
                    'access_token': config.get('access_token'),
                    'user_id': config.get('user_id'),
                    'device_id': config.get('device_id'),
                    'room_id': config.get('room_id')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_mattermost_integration(self, user_id, config):
        """Setup Mattermost integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='mattermost',
                channel_name='Mattermost',
                provider='mattermost_api',
                config=json.dumps({
                    'server_url': config.get('server_url'),
                    'access_token': config.get('access_token'),
                    'team_id': config.get('team_id'),
                    'channel_id': config.get('channel_id'),
                    'webhook_url': config.get('webhook_url')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_rocketchat_integration(self, user_id, config):
        """Setup RocketChat integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='rocketchat',
                channel_name='RocketChat',
                provider='rocketchat_api',
                config=json.dumps({
                    'server_url': config.get('server_url'),
                    'user_id': config.get('user_id'),
                    'auth_token': config.get('auth_token'),
                    'channel_name': config.get('channel_name'),
                    'webhook_url': config.get('webhook_url')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_getstream_integration(self, user_id, config):
        """Setup getstream.io chat and video integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='getstream',
                channel_name='GetStream Chat & Video',
                provider='getstream_api',
                config=json.dumps({
                    'api_key': config.get('api_key'),
                    'api_secret': config.get('api_secret'),
                    'app_id': config.get('app_id'),
                    'user_token': config.get('user_token'),
                    'channel_type': config.get('channel_type', 'messaging'),
                    'video_enabled': config.get('video_enabled', True)
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_agora_video_integration(self, user_id, config):
        """Setup Agora video calling integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='agora_video',
                channel_name='Agora Video Calls',
                provider='agora_rtc',
                config=json.dumps({
                    'app_id': config.get('app_id'),
                    'app_certificate': config.get('app_certificate'),
                    'channel_name': config.get('channel_name'),
                    'uid': config.get('uid'),
                    'token_server_url': config.get('token_server_url')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_daily_video_integration(self, user_id, config):
        """Setup Daily.co video integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='daily_video',
                channel_name='Daily.co Video',
                provider='daily_api',
                config=json.dumps({
                    'api_key': config.get('api_key'),
                    'domain_name': config.get('domain_name'),
                    'room_name': config.get('room_name'),
                    'webhook_url': config.get('webhook_url')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_twilio_video_integration(self, user_id, config):
        """Setup Twilio Video integration"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='twilio_video',
                channel_name='Twilio Video',
                provider='twilio_video',
                config=json.dumps({
                    'account_sid': config.get('account_sid'),
                    'api_key': config.get('api_key'),
                    'api_secret': config.get('api_secret'),
                    'room_sid': config.get('room_sid'),
                    'webhook_url': config.get('webhook_url')
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            return channel
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_email_channel(self, user_id, config):
        """Setup personal email channel with IMAP/SMTP"""
        try:
            channel = CommunicationChannel(
                user_id=user_id,
                channel_type='email',
                channel_name=config.get('name', 'Personal Email'),
                provider=config.get('provider', 'personal_smtp'),
                config=json.dumps({
                    # SMTP for sending
                    'smtp_server': config.get('smtp_server'),
                    'smtp_port': config.get('smtp_port', 587),
                    'smtp_username': config.get('smtp_username'),
                    'smtp_password': config.get('smtp_password'),
                    'use_tls': config.get('use_tls', True),
                    
                    # IMAP for receiving
                    'imap_server': config.get('imap_server'),
                    'imap_port': config.get('imap_port', 993),
                    'imap_username': config.get('imap_username'),
                    'imap_password': config.get('imap_password'),
                    'use_ssl': config.get('use_ssl', True),
                    
                    # Email details
                    'from_email': config.get('from_email'),
                    'from_name': config.get('from_name'),
                    'auto_check_interval': config.get('auto_check_interval', 300)  # 5 minutes
                })
            )
            
            db.session.add(channel)
            db.session.commit()
            
            # Test both SMTP and IMAP connections
            if self.test_email_connection(channel):
                return channel
            else:
                db.session.delete(channel)
                db.session.commit()
                raise Exception("Failed to connect to email servers")
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def send_telegram_message(self, channel, chat_id, message, media_urls=None):
        """Send Telegram message via Bot API"""
        try:
            config = json.loads(channel.config)
            bot_token = config['bot_token']
            
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            
            payload = {
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'Markdown'
            }
            
            # Send text message first
            response = requests.post(url, json=payload)
            response.raise_for_status()
            
            result = response.json()
            message_id = result.get('result', {}).get('message_id')
            
            # Send media if provided
            if media_urls:
                for media_url in media_urls:
                    media_type = self.detect_telegram_media_type(media_url)
                    media_url_endpoint = f"https://api.telegram.org/bot{bot_token}/send{media_type}"
                    
                    media_payload = {
                        'chat_id': chat_id,
                        media_type.lower(): media_url
                    }
                    
                    requests.post(media_url_endpoint, json=media_payload)
            
            return str(message_id)
            
        except Exception as e:
            print(f"Telegram send error: {e}")
            raise e
    
    def send_discord_message(self, channel, message, media_urls=None):
        """Send Discord message via webhook"""
        try:
            config = json.loads(channel.config)
            webhook_url = config['webhook_url']
            
            payload = {
                'content': message,
                'username': 'Creator CRM'
            }
            
            # Send message
            response = requests.post(webhook_url, json=payload)
            response.raise_for_status()
            
            # Send media if provided (Discord handles this automatically in embeds)
            if media_urls:
                for media_url in media_urls:
                    media_payload = {
                        'embeds': [{
                            'image': {'url': media_url} if self.is_image_url(media_url) else None,
                            'description': f"[Media File]({media_url})" if not self.is_image_url(media_url) else None
                        }]
                    }
                    requests.post(webhook_url, json=media_payload)
            
            return f"discord_{datetime.now().timestamp()}"
            
        except Exception as e:
            print(f"Discord send error: {e}")
            raise e
    
    def send_whatsapp_personal(self, channel, phone_number, message, media_urls=None):
        """Send WhatsApp message via personal web API"""
        try:
            config = json.loads(channel.config)
            api_url = config['api_url']
            api_token = config['api_token']
            instance_id = config['instance_id']
            
            url = f"{api_url}/sendMessage"
            
            headers = {
                'Authorization': f'Bearer {api_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'chatId': f"{phone_number}@c.us",
                'body': message,
                'instanceId': instance_id
            }
            
            # Send text message
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            message_id = result.get('id')
            
            # Send media if provided
            if media_urls:
                for media_url in media_urls:
                    media_payload = {
                        'chatId': f"{phone_number}@c.us",
                        'body': media_url,
                        'instanceId': instance_id,
                        'type': 'media'
                    }
                    requests.post(url, headers=headers, json=media_payload)
            
            return message_id
            
        except Exception as e:
            print(f"WhatsApp personal send error: {e}")
            raise e
    
    def send_email_message(self, channel, to_email, subject, message, media_attachments=None):
        """Send email via SMTP"""
        try:
            config = json.loads(channel.config)
            
            # Create message
            msg = MimeMultipart()
            msg['From'] = f"{config.get('from_name', 'Creator CRM')} <{config['from_email']}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add text body
            msg.attach(MimeText(message, 'plain'))
            
            # Add attachments if provided
            if media_attachments:
                for attachment_path in media_attachments:
                    if os.path.exists(attachment_path):
                        with open(attachment_path, 'rb') as f:
                            part = MimeBase('application', 'octet-stream')
                            part.set_payload(f.read())
                            encoders.encode_base64(part)
                            part.add_header(
                                'Content-Disposition',
                                f'attachment; filename= {os.path.basename(attachment_path)}'
                            )
                            msg.attach(part)
            
            # Connect to SMTP server and send
            server = smtplib.SMTP(config['smtp_server'], config['smtp_port'])
            
            if config.get('use_tls', True):
                server.starttls()
            
            server.login(config['smtp_username'], config['smtp_password'])
            server.send_message(msg)
            server.quit()
            
            return f"email_{datetime.now().timestamp()}"
            
        except Exception as e:
            print(f"Email send error: {e}")
            raise e
    
    def send_sms_via_twilio(self, channel, phone_number, message, media_urls=None):
        """Send SMS via Twilio (personal use friendly)"""
        try:
            config = json.loads(channel.config)
            account_sid = config['account_sid']
            auth_token = config['auth_token']
            from_number = config['from_number']
            
            client = TwilioClient(account_sid, auth_token)
            
            # Send message
            message_params = {
                'body': message,
                'from_': from_number,
                'to': phone_number
            }
            
            # Add media if provided
            if media_urls:
                message_params['media_url'] = media_urls
            
            twilio_message = client.messages.create(**message_params)
            return twilio_message.sid
            
        except Exception as e:
            print(f"Twilio SMS send error: {e}")
            raise e
    
    def send_message(self, user_id, channel_type, recipient, message, media_urls=None, client_id=None, subject=None):
        """Send message through specified channel"""
        try:
            # Get channel
            channel_key = f"{user_id}_{channel_type}"
            channel = self.channels.get(channel_key)
            
            if not channel:
                # Try to load from database
                channel = CommunicationChannel.query.filter_by(
                    user_id=user_id,
                    channel_type=channel_type,
                    is_active=True
                ).first()
                
                if not channel:
                    raise Exception(f"No active {channel_type} channel found")
                
                self.channels[channel_key] = channel
            
            # Send message based on channel type
            external_id = None
            
            if channel_type == 'telegram':
                external_id = self.send_telegram_message(channel, recipient, message, media_urls)
            elif channel_type == 'discord':
                external_id = self.send_discord_message(channel, message, media_urls)
            elif channel_type == 'whatsapp':
                external_id = self.send_whatsapp_personal(channel, recipient, message, media_urls)
            elif channel_type == 'email':
                external_id = self.send_email_message(channel, recipient, subject or "Message from Creator CRM", message, media_urls)
            elif channel_type == 'sms':
                external_id = self.send_sms_via_twilio(channel, recipient, message, media_urls)
            elif channel_type == 'facebook_messenger':
                external_id = self.send_facebook_message(channel, recipient, message, media_urls)
            elif channel_type == 'instagram':
                external_id = self.send_instagram_message(channel, recipient, message, media_urls)
            elif channel_type == 'x_twitter':
                external_id = self.send_twitter_dm(channel, recipient, message, media_urls)
            elif channel_type == 'reddit':
                external_id = self.send_reddit_message(channel, recipient, message)
            elif channel_type == 'bluesky':
                external_id = self.send_bluesky_message(channel, recipient, message)
            elif channel_type == 'twitch':
                external_id = self.send_twitch_message(channel, recipient, message)
            elif channel_type == 'tiktok':
                external_id = self.send_tiktok_message(channel, recipient, message)
            elif channel_type == 'rentmen':
                external_id = self.send_rentmen_message(channel, recipient, message)
            elif channel_type == 'slack':
                external_id = self.send_slack_message(channel, recipient, message)
            elif channel_type == 'teams':
                external_id = self.send_teams_message(channel, recipient, message)
            elif channel_type == 'zoom':
                external_id = self.send_zoom_message(channel, recipient, message)
            elif channel_type == 'wechat':
                external_id = self.send_wechat_message(channel, recipient, message)
            elif channel_type == 'line':
                external_id = self.send_line_message(channel, recipient, message)
            elif channel_type == 'snapchat':
                external_id = self.send_snapchat_message(channel, recipient, message)
            elif channel_type == 'linkedin':
                external_id = self.send_linkedin_message(channel, recipient, message)
            elif channel_type == 'element_matrix':
                external_id = self.send_matrix_message(channel, recipient, message)
            elif channel_type == 'mattermost':
                external_id = self.send_mattermost_message(channel, recipient, message)
            elif channel_type == 'rocketchat':
                external_id = self.send_rocketchat_message(channel, recipient, message)
            elif channel_type == 'getstream':
                external_id = self.send_getstream_message(channel, recipient, message)
            elif channel_type in ['agora_video', 'daily_video', 'twilio_video']:
                external_id = self.initiate_video_call(channel, recipient, channel_type)
            else:
                raise Exception(f"Unsupported channel type: {channel_type}")
            
            # Create message record
            message_record = Message(
                user_id=user_id,
                client_id=client_id,
                direction='outbound',
                channel_id=channel.id,
                channel_type=channel_type,
                content=message,
                phone_number=recipient if channel_type in ['sms', 'whatsapp'] else None,
                email_address=recipient if channel_type == 'email' else None,
                external_id=external_id,
                has_media=bool(media_urls),
                processed=True
            )
            
            db.session.add(message_record)
            db.session.commit()
            
            return message_record
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def process_incoming_telegram(self, webhook_data, user_id):
        """Process incoming Telegram webhook"""
        try:
            message = webhook_data.get('message', {})
            if not message:
                return
            
            chat = message.get('chat', {})
            chat_id = str(chat.get('id'))
            sender_name = f"{chat.get('first_name', '')} {chat.get('last_name', '')}".strip()
            username = chat.get('username')
            
            content = message.get('text', '')
            if not content and message.get('caption'):
                content = message.get('caption')
            
            # Handle media
            has_media = any(key in message for key in ['photo', 'video', 'audio', 'document', 'voice'])
            
            timestamp = datetime.fromtimestamp(message.get('date'), timezone.utc)
            
            # Find or create client
            client = Client.query.filter_by(
                user_id=user_id,
                phone_number=chat_id  # Using chat_id as identifier
            ).first()
            
            if not client:
                client = ClientModel(
                    user_id=user_id,
                    name=sender_name or username or f"Telegram User {chat_id}",
                    phone_number=chat_id,
                    notes=f"Telegram username: @{username}" if username else None
                )
                db.session.add(client)
                db.session.flush()
            
            # Create message record
            message_record = Message(
                user_id=user_id,
                client_id=client.id,
                direction='inbound',
                channel_type='telegram',
                content=content,
                phone_number=chat_id,
                external_id=str(message.get('message_id')),
                has_media=has_media,
                message_metadata=json.dumps(message),
                created_at=timestamp
            )
            
            db.session.add(message_record)
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            print(f"Telegram webhook processing error: {e}")
            raise e
    
    def check_email_inbox(self, channel):
        """Check for new emails via IMAP"""
        try:
            config = json.loads(channel.config)
            
            # Connect to IMAP server
            if config.get('use_ssl', True):
                mail = imaplib.IMAP4_SSL(config['imap_server'], config.get('imap_port', 993))
            else:
                mail = imaplib.IMAP4(config['imap_server'], config.get('imap_port', 143))
            
            mail.login(config['imap_username'], config['imap_password'])
            mail.select('INBOX')
            
            # Search for unread emails
            _, messages = mail.search(None, 'UNSEEN')
            message_ids = messages[0].split()
            
            for msg_id in message_ids[-10:]:  # Process last 10 unread emails
                _, msg_data = mail.fetch(msg_id, '(RFC822)')
                email_body = msg_data[0][1]
                email_message = message_from_bytes(email_body) if message_from_bytes else None
                
                sender = email_message['From']
                subject = email_message['Subject']
                date_str = email_message['Date']
                
                # Parse date
                try:
                    timestamp = email.utils.parsedate_to_datetime(date_str) if email else datetime.now(timezone.utc)
                except:
                    timestamp = datetime.now(timezone.utc)
                
                # Get email content
                content = self.extract_email_content(email_message)
                
                # Find or create client based on sender email
                sender_email = self.extract_email_address(sender)
                client = Client.query.filter_by(
                    user_id=channel.user_id,
                    email=sender_email
                ).first()
                
                if not client:
                    sender_name = self.extract_sender_name(sender)
                    client = ClientModel(
                        user_id=channel.user_id,
                        name=sender_name or sender_email,
                        email=sender_email
                    )
                    db.session.add(client)
                    db.session.flush()
                
                # Create message record
                message_record = Message(
                    user_id=channel.user_id,
                    client_id=client.id,
                    direction='inbound',
                    channel_id=channel.id,
                    channel_type='email',
                    content=f"Subject: {subject}\n\n{content}",
                    email_address=sender_email,
                    external_id=str(msg_id),
                    message_metadata=json.dumps({
                        'subject': subject,
                        'sender': sender,
                        'date': date_str
                    }),
                    created_at=timestamp
                )
                
                db.session.add(message_record)
            
            mail.close()
            mail.logout()
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            print(f"Email check error: {e}")
            raise e
    
    def detect_telegram_media_type(self, url):
        """Detect Telegram media type from URL"""
        url_lower = url.lower()
        if any(ext in url_lower for ext in ['.jpg', '.jpeg', '.png', '.gif']):
            return 'Photo'
        elif any(ext in url_lower for ext in ['.mp4', '.avi', '.mov']):
            return 'Video'
        elif any(ext in url_lower for ext in ['.mp3', '.wav', '.aac']):
            return 'Audio'
        else:
            return 'Document'
    
    def is_image_url(self, url):
        """Check if URL points to an image"""
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
        return any(url.lower().endswith(ext) for ext in image_extensions)
    
    def extract_email_content(self, email_message):
        """Extract text content from email message"""
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get('Content-Disposition'))
                
                if content_type == 'text/plain' and 'attachment' not in content_disposition:
                    return part.get_payload(decode=True).decode('utf-8', errors='ignore')
        else:
            return email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
        
        return "No readable content found"
    
    def extract_email_address(self, sender_string):
        """Extract email address from sender string"""
        import re
        email_pattern = r'<([^>]+)>|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'
        match = re.search(email_pattern, sender_string)
        if match:
            return match.group(1) or match.group(2)
        return sender_string
    
    def extract_sender_name(self, sender_string):
        """Extract sender name from sender string"""
        if '<' in sender_string:
            return sender_string.split('<')[0].strip().strip('"')
        return sender_string
    
    def test_telegram_connection(self, channel):
        """Test Telegram Bot API connection"""
        try:
            config = json.loads(channel.config)
            bot_token = config['bot_token']
            
            url = f"https://api.telegram.org/bot{bot_token}/getMe"
            response = requests.get(url)
            return response.status_code == 200 and response.json().get('ok', False)
            
        except Exception:
            return False
    
    def test_email_connection(self, channel):
        """Test email SMTP and IMAP connections"""
        try:
            config = json.loads(channel.config)
            
            # Test SMTP
            server = smtplib.SMTP(config['smtp_server'], config['smtp_port'])
            if config.get('use_tls', True):
                server.starttls()
            server.login(config['smtp_username'], config['smtp_password'])
            server.quit()
            
            # Test IMAP
            if config.get('use_ssl', True):
                mail = imaplib.IMAP4_SSL(config['imap_server'], config.get('imap_port', 993))
            else:
                mail = imaplib.IMAP4(config['imap_server'], config.get('imap_port', 143))
            
            mail.login(config['imap_username'], config['imap_password'])
            mail.close()
            mail.logout()
            
            return True
            
        except Exception:
            return False
    
    def send_facebook_message(self, channel, recipient_id, message, media_urls=None):
        """Send Facebook Messenger message"""
        try:
            config = json.loads(channel.config)
            access_token = config['page_access_token']
            
            url = f"https://graph.facebook.com/v18.0/me/messages"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'recipient': {'id': recipient_id},
                'message': {'text': message}
            }
            
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            return result.get('message_id')
            
        except Exception as e:
            print(f"Facebook Messenger send error: {e}")
            raise e
    
    def send_instagram_message(self, channel, recipient_id, message, media_urls=None):
        """Send Instagram Direct Message"""
        try:
            config = json.loads(channel.config)
            access_token = config['access_token']
            instagram_account_id = config['instagram_account_id']
            
            url = f"https://graph.facebook.com/v18.0/{instagram_account_id}/messages"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'recipient': {'id': recipient_id},
                'message': {'text': message}
            }
            
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            return result.get('message_id')
            
        except Exception as e:
            print(f"Instagram message send error: {e}")
            raise e
    
    def send_twitter_dm(self, channel, recipient_id, message, media_urls=None):
        """Send Twitter/X Direct Message"""
        try:
            config = json.loads(channel.config)
            bearer_token = config['bearer_token']
            
            url = "https://api.twitter.com/2/dm_conversations/with/{}/messages".format(recipient_id)
            
            headers = {
                'Authorization': f'Bearer {bearer_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'text': message,
                'media_ids': media_urls if media_urls else []
            }
            
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            return result.get('data', {}).get('dm_event_id')
            
        except Exception as e:
            print(f"Twitter DM send error: {e}")
            raise e
    
    def send_reddit_message(self, channel, recipient_username, message):
        """Send Reddit private message"""
        try:
            config = json.loads(channel.config)
            
            # First get OAuth token
            auth = requests.auth.HTTPBasicAuth(config['client_id'], config['client_secret'])
            data = {
                'grant_type': 'password',
                'username': config['username'],
                'password': config['password']
            }
            headers = {'User-Agent': config['user_agent']}
            
            token_response = requests.post('https://www.reddit.com/api/v1/access_token',
                                        auth=auth, data=data, headers=headers)
            token_response.raise_for_status()
            
            token = token_response.json()['access_token']
            
            # Send message
            headers['Authorization'] = f'Bearer {token}'
            
            message_data = {
                'to': recipient_username,
                'subject': 'Message from Creator CRM',
                'text': message
            }
            
            response = requests.post('https://oauth.reddit.com/api/compose',
                                   headers=headers, data=message_data)
            response.raise_for_status()
            
            return f"reddit_{int(time.time())}"
            
        except Exception as e:
            print(f"Reddit message send error: {e}")
            raise e
    
    def send_bluesky_message(self, channel, recipient_handle, message):
        """Send BlueSky message via AT Protocol"""
        try:
            config = json.loads(channel.config)
            
            # Create session if needed
            if not config.get('access_jwt'):
                session_data = {
                    'identifier': config['handle'],
                    'password': config['password']
                }
                
                session_response = requests.post(
                    f"{config['pds_url']}/xrpc/com.atproto.server.createSession",
                    json=session_data
                )
                session_response.raise_for_status()
                
                session = session_response.json()
                access_jwt = session['accessJwt']
            else:
                access_jwt = config['access_jwt']
            
            # Send message (DM functionality may be limited in current AT Protocol)
            headers = {'Authorization': f'Bearer {access_jwt}'}
            
            # For now, create a mention post as DMs aren't fully implemented
            post_data = {
                'repo': config['handle'],
                'collection': 'app.bsky.feed.post',
                'record': {
                    'text': f"@{recipient_handle} {message}",
                    'createdAt': datetime.now(timezone.utc).isoformat()
                }
            }
            
            response = requests.post(
                f"{config['pds_url']}/xrpc/com.atproto.repo.createRecord",
                headers=headers,
                json=post_data
            )
            response.raise_for_status()
            
            result = response.json()
            return result.get('uri')
            
        except Exception as e:
            print(f"BlueSky message send error: {e}")
            raise e
    
    def send_twitch_message(self, channel, recipient_username, message):
        """Send Twitch whisper message"""
        try:
            config = json.loads(channel.config)
            
            # Get user ID for recipient
            headers = {
                'Authorization': f'Bearer {config["access_token"]}',
                'Client-Id': config['client_id']
            }
            
            user_response = requests.get(
                f"https://api.twitch.tv/helix/users?login={recipient_username}",
                headers=headers
            )
            user_response.raise_for_status()
            
            user_data = user_response.json()
            if not user_data.get('data'):
                raise Exception(f"User {recipient_username} not found")
            
            recipient_id = user_data['data'][0]['id']
            
            # Send whisper
            whisper_data = {
                'message': message
            }
            
            response = requests.post(
                f"https://api.twitch.tv/helix/whispers?from_user_id={config.get('bot_user_id')}&to_user_id={recipient_id}",
                headers=headers,
                json=whisper_data
            )
            response.raise_for_status()
            
            return f"twitch_whisper_{int(time.time())}"
            
        except Exception as e:
            print(f"Twitch message send error: {e}")
            raise e
    
    def send_tiktok_message(self, channel, recipient_id, message):
        """Send TikTok direct message"""
        try:
            config = json.loads(channel.config)
            
            # TikTok Business API for messaging (limited access)
            headers = {
                'Authorization': f'Bearer {config["access_token"]}',
                'Content-Type': 'application/json'
            }
            
            message_data = {
                'recipient_id': recipient_id,
                'message_type': 'text',
                'message': {
                    'text': message
                }
            }
            
            # Note: This endpoint may require special permissions
            response = requests.post(
                'https://business-api.tiktok.com/open_api/v1.3/dm/send/',
                headers=headers,
                json=message_data
            )
            response.raise_for_status()
            
            result = response.json()
            return result.get('data', {}).get('message_id')
            
        except Exception as e:
            print(f"TikTok message send error: {e}")
            raise e
    
    def send_rentmen_message(self, channel, recipient_username, message):
        """Send message via Rent.men"""
        try:
            config = json.loads(channel.config)
            
            # Login to get session (if not already authenticated)
            session = requests.Session()
            
            if config.get('session_token'):
                session.headers.update({
                    'Authorization': f'Bearer {config["session_token"]}',
                    'User-Agent': 'CreatorCRM/1.0'
                })
            else:
                # Login to get session
                login_data = {
                    'username': config['username'],
                    'password': config['password']
                }
                
                login_response = session.post(
                    'https://rent.men/api/login',
                    json=login_data
                )
                login_response.raise_for_status()
                
                auth_data = login_response.json()
                session.headers.update({
                    'Authorization': f'Bearer {auth_data.get("access_token")}',
                    'User-Agent': 'CreatorCRM/1.0'
                })
            
            # Send message
            message_data = {
                'recipient': recipient_username,
                'message': message,
                'type': 'text'
            }
            
            response = session.post(
                f"{config.get('api_endpoint', 'https://rent.men/api')}/messages/send",
                json=message_data
            )
            response.raise_for_status()
            
            result = response.json()
            return result.get('message_id', f"rentmen_{int(time.time())}")
            
        except Exception as e:
            print(f"Rent.men message send error: {e}")
            raise e
    
    def send_slack_message(self, channel, recipient, message):
        """Send Slack message"""
        try:
            config = json.loads(channel.config)
            bot_token = config['bot_token']
            
            headers = {
                'Authorization': f'Bearer {bot_token}',
                'Content-Type': 'application/json'
            }
            
            # Send direct message
            payload = {
                'channel': recipient,  # Can be user ID or @username
                'text': message
            }
            
            response = requests.post(
                'https://slack.com/api/chat.postMessage',
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            if result.get('ok'):
                return result.get('ts')
            else:
                raise Exception(f"Slack API error: {result.get('error')}")
            
        except Exception as e:
            print(f"Slack message send error: {e}")
            raise e
    
    def send_teams_message(self, channel, recipient, message):
        """Send Microsoft Teams message"""
        try:
            config = json.loads(channel.config)
            access_token = config['access_token']
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Send message via Microsoft Graph API
            payload = {
                'body': {
                    'content': message,
                    'contentType': 'text'
                }
            }
            
            response = requests.post(
                f'https://graph.microsoft.com/v1.0/chats/{recipient}/messages',
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            return result.get('id')
            
        except Exception as e:
            print(f"Teams message send error: {e}")
            raise e
    
    def send_zoom_message(self, channel, recipient, message):
        """Send Zoom chat message"""
        try:
            config = json.loads(channel.config)
            access_token = config['access_token']
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'message': message,
                'to_jid': recipient
            }
            
            response = requests.post(
                'https://api.zoom.us/v2/im/chat/messages',
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            return result.get('id')
            
        except Exception as e:
            print(f"Zoom message send error: {e}")
            raise e
    
    def send_wechat_message(self, channel, recipient, message):
        """Send WeChat message"""
        try:
            config = json.loads(channel.config)
            access_token = config['access_token']
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            payload = {
                'touser': recipient,
                'msgtype': 'text',
                'text': {
                    'content': message
                }
            }
            
            response = requests.post(
                f'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token={access_token}',
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            if result.get('errcode') == 0:
                return f"wechat_{int(time.time())}"
            else:
                raise Exception(f"WeChat API error: {result.get('errmsg')}")
            
        except Exception as e:
            print(f"WeChat message send error: {e}")
            raise e
    
    def send_line_message(self, channel, recipient, message):
        """Send Line message"""
        try:
            config = json.loads(channel.config)
            access_token = config['channel_access_token']
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'to': recipient,
                'messages': [
                    {
                        'type': 'text',
                        'text': message
                    }
                ]
            }
            
            response = requests.post(
                'https://api.line.me/v2/bot/message/push',
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            return f"line_{int(time.time())}"
            
        except Exception as e:
            print(f"Line message send error: {e}")
            raise e
    
    def send_snapchat_message(self, channel, recipient, message):
        """Send Snapchat message"""
        try:
            config = json.loads(channel.config)
            access_token = config['access_token']
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Note: Snapchat API is limited and requires special approval
            payload = {
                'recipient_ids': [recipient],
                'message': {
                    'text': message
                }
            }
            
            response = requests.post(
                'https://kit.snapchat.com/v1/conversations',
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            return result.get('conversation_id')
            
        except Exception as e:
            print(f"Snapchat message send error: {e}")
            raise e
    
    def send_linkedin_message(self, channel, recipient, message):
        """Send LinkedIn message"""
        try:
            config = json.loads(channel.config)
            access_token = config['access_token']
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'recipients': [recipient],
                'message': {
                    'subject': 'Message from Creator CRM',
                    'body': message
                }
            }
            
            response = requests.post(
                'https://api.linkedin.com/v2/messages',
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            return result.get('value', [{}])[0].get('$URN')
            
        except Exception as e:
            print(f"LinkedIn message send error: {e}")
            raise e
    
    def send_matrix_message(self, channel, recipient, message):
        """Send Matrix/Element message"""
        try:
            config = json.loads(channel.config)
            access_token = config['access_token']
            homeserver_url = config['homeserver_url']
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Generate transaction ID
            txn_id = f"m{int(time.time() * 1000)}"
            
            payload = {
                'msgtype': 'm.text',
                'body': message
            }
            
            response = requests.put(
                f'{homeserver_url}/_matrix/client/r0/rooms/{recipient}/send/m.room.message/{txn_id}',
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            return result.get('event_id')
            
        except Exception as e:
            print(f"Matrix message send error: {e}")
            raise e
    
    def send_mattermost_message(self, channel, recipient, message):
        """Send Mattermost message"""
        try:
            config = json.loads(channel.config)
            access_token = config['access_token']
            server_url = config['server_url']
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'channel_id': recipient,
                'message': message
            }
            
            response = requests.post(
                f'{server_url}/api/v4/posts',
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            return result.get('id')
            
        except Exception as e:
            print(f"Mattermost message send error: {e}")
            raise e
    
    def send_rocketchat_message(self, channel, recipient, message):
        """Send RocketChat message"""
        try:
            config = json.loads(channel.config)
            auth_token = config['auth_token']
            user_id = config['user_id']
            server_url = config['server_url']
            
            headers = {
                'X-Auth-Token': auth_token,
                'X-User-Id': user_id,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'channel': recipient,
                'text': message
            }
            
            response = requests.post(
                f'{server_url}/api/v1/chat.postMessage',
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            if result.get('success'):
                return result.get('message', {}).get('_id')
            else:
                raise Exception(f"RocketChat error: {result.get('error')}")
            
        except Exception as e:
            print(f"RocketChat message send error: {e}")
            raise e
    
    def send_getstream_message(self, channel, recipient, message):
        """Send GetStream chat message"""
        try:
            config = json.loads(channel.config)
            api_key = config['api_key']
            api_secret = config['api_secret']
            user_token = config['user_token']
            
            headers = {
                'Authorization': f'Bearer {user_token}',
                'Content-Type': 'application/json',
                'Stream-Auth-Type': 'jwt'
            }
            
            payload = {
                'text': message,
                'user': {
                    'id': 'creator-crm-user'
                }
            }
            
            response = requests.post(
                f'https://chat.stream-io-api.com/channels/{config.get("channel_type", "messaging")}/{recipient}/message?api_key={api_key}',
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            return result.get('message', {}).get('id')
            
        except Exception as e:
            print(f"GetStream message send error: {e}")
            raise e
    
    def initiate_video_call(self, channel, recipient, video_platform):
        """Initiate video call based on platform"""
        try:
            config = json.loads(channel.config)
            
            if video_platform == 'agora_video':
                return self.create_agora_video_call(config, recipient)
            elif video_platform == 'daily_video':
                return self.create_daily_video_call(config, recipient)
            elif video_platform == 'twilio_video':
                return self.create_twilio_video_call(config, recipient)
            else:
                raise Exception(f"Unsupported video platform: {video_platform}")
                
        except Exception as e:
            print(f"Video call initiation error: {e}")
            raise e
    
    def create_agora_video_call(self, config, recipient):
        """Create Agora video call room"""
        try:
            app_id = config['app_id']
            app_certificate = config.get('app_certificate')
            
            # Generate channel name for the call
            channel_name = f"call_{int(time.time())}"
            
            # In production, you'd generate a proper token using Agora's token server
            # For now, return the call details
            call_details = {
                'platform': 'agora',
                'app_id': app_id,
                'channel_name': channel_name,
                'recipient': recipient,
                'call_url': f"https://your-agora-frontend.com/call/{channel_name}",
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            
            return f"agora_call_{channel_name}"
            
        except Exception as e:
            print(f"Agora video call creation error: {e}")
            raise e
    
    def create_daily_video_call(self, config, recipient):
        """Create Daily.co video call room"""
        try:
            api_key = config['api_key']
            domain_name = config.get('domain_name')
            
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            # Create a new room
            room_config = {
                'name': f"call-{int(time.time())}",
                'privacy': 'private',
                'properties': {
                    'max_participants': 2,
                    'enable_chat': True,
                    'enable_screenshare': True
                }
            }
            
            response = requests.post(
                'https://api.daily.co/v1/rooms',
                headers=headers,
                json=room_config
            )
            response.raise_for_status()
            
            result = response.json()
            return result.get('url')
            
        except Exception as e:
            print(f"Daily.co video call creation error: {e}")
            raise e
    
    def create_twilio_video_call(self, config, recipient):
        """Create Twilio Video call room"""
        try:
            account_sid = config['account_sid']
            api_key = config['api_key']
            api_secret = config['api_secret']
            
            # Use Twilio client
            from twilio.rest import Client
            client = Client(api_key, api_secret, account_sid)
            
            # Create a room
            room_name = f"call-{int(time.time())}"
            room = client.video.rooms.create(
                unique_name=room_name,
                type='go'  # Small Group room type
            )
            
            return room.sid
            
        except Exception as e:
            print(f"Twilio Video call creation error: {e}")
            raise e
    
    def get_user_channels(self, user_id):
        """Get all channels for a user"""
        return CommunicationChannel.query.filter_by(user_id=user_id).all()
    
    def deactivate_channel(self, channel_id, user_id):
        """Deactivate a communication channel"""
        channel = CommunicationChannel.query.filter_by(
            id=channel_id,
            user_id=user_id
        ).first()
        
        if channel:
            channel.is_active = False
            db.session.commit()
            
            # Remove from cache
            channel_key = f"{user_id}_{channel.channel_type}"
            if channel_key in self.channels:
                del self.channels[channel_key]
        
        return channel